import Redis from 'ioredis';
import { WatchEventParameters } from 'viem';
import { AbiEvent } from 'abitype';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';

import { CrossbellContractService } from '@/module/contract/contract.service';
import { PrismaService } from '@/module/prisma/prisma.service';

import { publicClient } from '@/utils/public-client';
import { bigIntMin } from '@/utils/bigint';

@Injectable()
export class EventListenersBaseService implements OnApplicationShutdown {
  readonly #logger = new Logger(EventListenersBaseService.name);
  readonly #disposers = new Set<() => void>();

  protected contract =
    this.contractService.getOrCreateContract('operator-sign');

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly contractService: CrossbellContractService,
    @InjectRedis() protected readonly redis: Redis,
  ) {}

  async onApplicationShutdown() {
    this.#disposers.forEach((dispose) => dispose());
    this.#disposers.clear();
  }

  /**
   * Check if event a is after (>) event b
   */
  protected isAfter(
    a: { blockNumber: number; logIndex: number },
    b: { blockNumber: number; logIndex: number },
  ) {
    if (a.blockNumber === b.blockNumber) {
      return a.logIndex > b.logIndex;
    }

    return a.blockNumber > b.blockNumber;
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
            data: { blockNumber: Number(bigIntMin(toBlock, latestBlock)) },
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
