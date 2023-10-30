import { CrossbellContractService } from '@/module/contract/contract.service';
import { OP_SIGN_OPERATOR_WALLET_ADDRESS } from '@/module/op/op.constants';
import { CsbManagerService } from '@/module/csb-manager/csb-manager.service';
import { PrismaService } from '@/module/prisma/prisma.service';
import { WebException } from '@/utils/exception';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { Contract, Result } from 'crossbell';
import { BigNumber } from 'ethers';
import Redis from 'ioredis';
import { setTimeout } from 'timers/promises';
import retry from 'async-retry';
import { publicClient } from '@/utils/public-client';
import { isAddress, isAddressEqual, WatchEventParameters } from 'viem';
import { AbiEvent } from 'abitype';

@Injectable()
export class SiweTransactionBaseService implements OnApplicationShutdown {
  readonly #logger = new Logger(SiweTransactionBaseService.name);
  readonly #disposers = new Set<() => void>();

  protected contract =
    this.contractService.getOrCreateContract('operator-sign');

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly csbManagerService: CsbManagerService,
    protected readonly contractService: CrossbellContractService,
    @InjectRedis() protected readonly redis: Redis,
  ) {}

  protected async useContract<T extends Result<any, true>>(
    address: string,
    /** if undefined, the character's op is not checked */
    characterId: number | undefined,
    fn: (contract: Contract) => Promise<T>,
  ): Promise<T> {
    try {
      await Promise.all([
        characterId ? this.checkOperator(characterId) : Promise.resolve(),
        this.checkCsb(address),
      ]);
      const res = await retry(() => fn(this.contract), { retries: 3 });
      if (res.transactionHash) {
        await this.spendCsbForTx(address, res.transactionHash);
      }
      await setTimeout(1000); // wait to be indexed
      return res;
    } catch (err: any) {
      this.#logger.error(err);
      throw new WebException(err.message);
    }
  }

  async onApplicationShutdown() {
    this.#disposers.forEach((dispose) => dispose());
    this.#disposers.clear();
  }

  /**
   * @throws WebException if the user has no CSB
   */
  private async checkCsb(address: string): Promise<void> {
    const enough = await this.hasEnoughCsb(address);
    if (!enough) {
      throw new WebException(
        'You do not have enough $CSB to perform this action',
      );
    }
  }

  /**
   * @throws WebException if the character does not authorize the op signer as operator
   */
  private async checkOperator(characterId: number): Promise<void> {
    const list = await this.prisma.characterOperator.findMany({
      where: { characterId },
      select: { characterId: true, operator: true, permissions: true },
    });

    const operator = list.find(
      ({ operator, permissions }) =>
        isAddress(operator) &&
        isAddressEqual(operator, OP_SIGN_OPERATOR_WALLET_ADDRESS) &&
        permissions.length !== 0,
    );

    if (!operator) {
      throw new WebException(
        `You have not authorized the op signer (address: ${OP_SIGN_OPERATOR_WALLET_ADDRESS}) as an operator for this character (id: ${characterId})`,
      );
    }
  }

  /**
   * @returns remaining balance in wei
   */
  async getCurrentCsb(address: string): Promise<string> {
    const user = await this.prisma.opSignUser.findUnique({
      where: { address },
      select: { csbRecharged: true, csbSpent: true },
    });
    if (!user) {
      const date = new Date();
      await this.prisma.opSignUser.create({
        data: { address, createdAt: date, updatedAt: date },
      });
      return '0';
    }
    const currentCsb = BigNumber.from(user.csbRecharged).sub(
      BigNumber.from(user.csbSpent),
    );
    if (currentCsb.lt(0)) {
      return '0';
    }
    return currentCsb.toString();
  }

  /**
   * @returns true if the user has enough CSB (> 0)
   */
  private async hasEnoughCsb(address: string): Promise<boolean> {
    const currentCsb = await this.getCurrentCsb(address);
    return BigNumber.from(currentCsb).gt(0);
  }

  /**
   * @returns remaining CSB in wei string
   */
  private async spendCsbForTx(
    address: string,
    txHash: string,
  ): Promise<string> {
    const user = await this.prisma.opSignUser.findUnique({
      where: { address },
      select: { csbSpent: true },
    });
    if (!user) {
      throw new WebException('User not found', { status: 400 });
    }
    const gas = await this.csbManagerService.getGasOfTx(txHash);
    const newCsbSpent = this.csbManagerService.addCsb(user.csbSpent, gas);
    const updatedUser = await this.prisma.opSignUser.update({
      where: { address },
      data: { csbSpent: newCsbSpent, updatedAt: new Date() },
      select: { csbSpent: true },
    });
    return updatedUser.csbSpent;
  }

  async getNonce() {
    const newNonce = await this.contract.publicClient.getTransactionCount({
      address: this.contract.account.address,
      blockTag: 'pending',
    });
    return newNonce;
  }

  protected async getHistoryAndListen<
    const TAbiEvent extends AbiEvent,
    const TAbiEvents extends
      | readonly AbiEvent[]
      | readonly unknown[]
      | undefined = TAbiEvent extends AbiEvent ? [TAbiEvent] : undefined,
    TStrict extends boolean | undefined = undefined,
  >(params: WatchEventParameters<TAbiEvent, TAbiEvents, TStrict>) {
    const step = 10000000n;

    if (params.event?.name) {
      const eventName = params.event.name;
      const eventPoint = await this.prisma.eventPoint.findUnique({
        where: { eventName },
      });

      if (eventPoint) {
        this.#logger.debug(`Start retrieving logs for [${eventName}]`);

        let latestBlock = await publicClient.getBlockNumber();
        let fromBlock = BigInt(eventPoint.blockNumber) + 1n;
        let toBlock = fromBlock + step;

        while (fromBlock < latestBlock) {
          this.#logger.debug(
            `Retrieve logs for [${eventName}] from [${fromBlock}] to [${toBlock}]`,
          );

          const logs = await publicClient.getLogs({
            address: params.address,
            event: params.event,
            fromBlock,
            toBlock,
          });

          if (logs.length > 0) {
            this.#logger.debug(
              `Found [${logs.length}] log(s) for [${eventName}]`,
            );
            await params.onLogs(logs as any);
          }

          await this.prisma.eventPoint.update({
            where: { eventName },
            data: { blockNumber: Number(toBlock) },
          });

          fromBlock = toBlock + 1n;
          toBlock = fromBlock + step;
          latestBlock = await publicClient.getBlockNumber();
        }

        this.#logger.debug(`Finish retrieving logs for [${eventName}]`);
      } else {
        const latestBlockNumber = await publicClient.getBlockNumber();

        this.#logger.debug(
          `No existing event point for [${eventName}]. Create a new one starting at [${latestBlockNumber}].`,
        );

        await this.prisma.eventPoint.create({
          data: {
            eventName: params.event.name,
            blockNumber: Number(latestBlockNumber),
          },
        });
      }
    }

    this.#logger.debug(`Start watching the [${params.event?.name}] event.`);

    const unwatch = publicClient.watchEvent({
      ...(params as any),
      onLogs: (async (logs) => {
        this.#logger.debug(
          `Receive ${logs.length} log(s) for [${
            params.event?.name ?? 'unknown'
          }] event`,
        );

        await params.onLogs(logs);

        const lastBlockNumber = findLastBlockNumber(logs);

        if (params.event?.name && lastBlockNumber !== null) {
          await this.prisma.eventPoint.update({
            where: { eventName: params.event.name },
            data: { blockNumber: Number(lastBlockNumber) },
          });
        }
      }) satisfies typeof params.onLogs,
    });

    const disposer = () => {
      this.#logger.debug(`Stop watching the [${params.event?.name}] event.`);
      unwatch();
      this.#disposers.delete(disposer);
    };

    this.#disposers.add(disposer);

    return disposer;
  }
}

function findLastBlockNumber(logs: { blockNumber: bigint }[]): bigint | null {
  return logs.reduce(
    (max, curr) => {
      if (max === null) {
        return curr.blockNumber;
      } else {
        return curr.blockNumber > max ? curr.blockNumber : max;
      }
    },
    null as null | bigint,
  );
}
