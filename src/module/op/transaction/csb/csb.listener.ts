import { CrossbellContractService } from '@/module/contract/contract.service';
import { OP_SIGN_OPERATOR_WALLET_ADDRESS } from '@/module/op/op.constants';
import { PrismaService } from '@/module/prisma/prisma.service';
import { isAddressEqual } from '@/utils/eth';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventPoint } from '@prisma/client';
import { Mutex } from 'async-mutex';
import { BigNumber } from 'ethers';
import { setTimeout } from 'timers/promises';
import { Pool } from 'undici';
import retry from 'async-retry';

type KuroraLog = {
  hash: `0x${string}`;
  index: number;
  chain_id: null;
  from: string;
  to: string;
  nonce: number;
  input: string;
  value: string;
  type: number;
  gas: number;
  gas_price: number;
  gas_fee_cap: null;
  gas_tip_cap: null;
  access_list: null;
  r: string;
  s: string;
  v: string;
  block_hash: string;
  block_number: string;
  timestamp: string;
};

@Injectable()
export class SiweCsbTransferListener implements OnModuleInit {
  private readonly logger = new Logger(SiweCsbTransferListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private contractService: CrossbellContractService,
  ) {}

  private readonly kurora = new Pool(process.env.KURORA_ENDPOINT!);

  private contract = this.contractService.getOrCreateContract();

  async onModuleInit() {
    // run listener
    if (process.env.DISABLE_CHAIN_EVENT_LISTENER === 'true') {
      this.logger.log(
        'Chain event listener is disabled. (DISABLE_CHAIN_EVENT_LISTENER=true)',
      );
      return;
    }

    this.logger.log(
      'Listening to Kurora events for csb transferring to op signer...',
    );
    this.listenToTransferEvents();
  }

  async listenToTransferEvents() {
    while (true) {
      await this._listenToTransferEvents();
    }
  }

  private async _listenToTransferEvents() {
    // https://kurora-v2.rss3.dev/networks/crossbell/transactions?to=0xBBC2918C9003D264c25EcAE45B44a846702C0E7c&limit=10
    const { blockNumber, transactionHash } = await this.getBreakpoint();
    try {
      const res = (await this.kurora
        .request({
          path: `/networks/crossbell/transactions?to=${OP_SIGN_OPERATOR_WALLET_ADDRESS}&limit=100&block_number_from=${blockNumber}${
            transactionHash ? `&cursor=${transactionHash}` : ''
          }`,
          method: 'GET',
        })
        .then(({ body }) => body.json())) as KuroraLog[];

      if (res.length > 0) {
        this.logger.log(
          `Got ${res.length} events from Kurora. (blockNumber: ${blockNumber}, transactionHash: ${transactionHash})`,
        );
        for (const event of res) {
          try {
            await retry(
              async () => {
                const receipt =
                  await this.contract.publicClient.getTransactionReceipt({
                    hash: event.hash,
                  });
                const isSuccessfulTransaction = receipt.status === 'success';
                if (isSuccessfulTransaction) {
                  await this.handleCsbTransferredEvent(event);
                }
              },
              { retries: 10 },
            );
          } catch (err) {
            this.logger.error(err);
            throw err;
          }
        }
        // update the breakpoint
        const last = res[res.length - 1];
        await this.setBreakpoint(parseInt(last.block_number, 10), last.hash);
        // continue
        return;
      } else {
        await setTimeout(1000);
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  private transferMutex = new Mutex();

  async handleCsbTransferredEvent(e: KuroraLog) {
    const { from, to, value, timestamp } = e;
    const fromAddress = from?.toLowerCase?.();
    const toAddress = to?.toLowerCase?.();
    const amount = value;
    const emittedAt = new Date(timestamp);

    if (!fromAddress) return;

    if (isAddressEqual(toAddress, OP_SIGN_OPERATOR_WALLET_ADDRESS)) {
      await this.transferMutex.runExclusive(async () => {
        const user = await this.prisma.opSignUser.findUnique({
          where: { address: fromAddress },
          select: { csbRecharged: true },
        });
        if (!user) {
          await this.prisma.opSignUser.create({
            data: {
              address: fromAddress,
              csbRecharged: amount,
              createdAt: emittedAt,
              updatedAt: emittedAt,
            },
          });
        } else {
          const newCsbRecharged = BigNumber.from(user.csbRecharged)
            .add(amount)
            .toString();
          await this.prisma.opSignUser.update({
            where: { address: fromAddress },
            data: {
              csbRecharged: newCsbRecharged,
              updatedAt: emittedAt,
            },
          });
        }
      });
    }
  }

  private EVENT_NAME = 'CsbTransferToOpSigner';
  private async getBreakpoint(): Promise<EventPoint> {
    const point = await this.prisma.eventPoint.findFirst({
      where: { eventName: this.EVENT_NAME },
    });

    if (!point) {
      const point = await this.prisma.eventPoint.create({
        data: {
          eventName: this.EVENT_NAME,
          blockNumber: 1,
          transactionHash: '',
        },
      });

      return point;
    }

    return point;
  }

  private async setBreakpoint(blockNumber: number, transactionHash: string) {
    await this.prisma.eventPoint.update({
      where: { eventName: this.EVENT_NAME },
      data: { blockNumber, transactionHash },
    });
  }
}
