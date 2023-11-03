import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Mutex } from 'async-mutex';
import { Prisma } from '@prisma/client';
import { Abi } from 'crossbell';
import { isAddressEqual, isAddress, parseEther } from 'viem';

import { indexer } from '@/utils/indexer';
import { getAbiEvent } from '@/utils/get-abi-event';
import { getDateOfBlock } from '@/utils/get-date-of-block';
import { OP_SIGN_OPERATOR_WALLET_ADDRESS } from '@/utils/constants';

import { EventListenersBaseService } from './base.service';

@Injectable()
export class OperatorToggleListenersService
  extends EventListenersBaseService
  implements OnApplicationBootstrap
{
  readonly logger = new Logger(OperatorToggleListenersService.name);
  async onApplicationBootstrap() {
    this.handleOperatorForCharacterGranted();
  }

  async handleOperatorForCharacterGranted() {
    const grantOperatorPermissions = getAbiEvent(
      Abi.entry,
      'GrantOperatorPermissions',
    );

    this.getHistoryAndListen({
      event: grantOperatorPermissions,
      onLogs: async (logs) => {
        for (const log of logs) {
          const { characterId, permissionBitMap = 0n } = log.args;
          const operator = log.args.operator?.toLowerCase();

          if (characterId && operator) {
            const date = await getDateOfBlock(log.blockNumber);
            const permissions =
              this.contract.operator.convertUint256ToPermissionsForCharacter(
                permissionBitMap,
              );

            await this.updateCharacterOperator({
              characterId: Number(characterId),
              operator,
              permissions,
              createdAt: date,
              updatedAt: date,
              transactionHash: log.transactionHash,
              blockNumber: Number(log.blockNumber),
              logIndex: log.logIndex,
              updatedTransactionHash: log.transactionHash,
              updatedBlockNumber: Number(log.blockNumber),
              updatedLogIndex: log.logIndex,
            });
          }
        }
      },
    });
  }

  private characterOperatorMutex = new Mutex(); // TODO: row lock

  private async updateCharacterOperator(
    characterOperator: Prisma.CharacterOperatorCreateInput,
  ) {
    await this.characterOperatorMutex.runExclusive(async () => {
      // update the latest characterOperator
      const oCharacterOperator = await this.prisma.characterOperator.findUnique(
        {
          where: {
            characterId_operator: {
              characterId: characterOperator.characterId,
              operator: characterOperator.operator,
            },
          },
        },
      );

      // FIXME: extract this logic
      // task: grant 0.01 CSB if the operator is the official OP SIGNER for the first time
      if (
        isAddress(characterOperator.operator) &&
        isAddressEqual(
          characterOperator.operator,
          OP_SIGN_OPERATOR_WALLET_ADDRESS,
        )
      ) {
        const char = await indexer.character.get(characterOperator.characterId);

        if (char?.owner) {
          this.rewardCsb(char.owner, parseEther('0.01'));
        } else {
          this.logger.warn(
            `Failed to send CSB to an unknown character ${characterOperator.characterId}`,
          );
        }
      }

      characterOperator = {
        ...oCharacterOperator,
        ...characterOperator,
        createdAt: oCharacterOperator?.createdAt ?? characterOperator.createdAt,
        transactionHash:
          oCharacterOperator?.transactionHash ??
          characterOperator.transactionHash,
        blockNumber:
          oCharacterOperator?.blockNumber ?? characterOperator.blockNumber,
        logIndex: oCharacterOperator?.logIndex ?? characterOperator.logIndex,
      };

      if (oCharacterOperator) {
        const isAfter = this.isAfter(
          {
            blockNumber: characterOperator.updatedBlockNumber,
            logIndex: characterOperator.updatedLogIndex,
          },
          {
            blockNumber: oCharacterOperator.blockNumber,
            logIndex: oCharacterOperator.logIndex,
          },
        );
        if (isAfter) {
          // update the old characterOperator
          await this.prisma.characterOperator.update({
            where: {
              characterId_operator: {
                characterId: characterOperator.characterId,
                operator: characterOperator.operator,
              },
            },
            data: characterOperator,
          });
        }
      } else {
        await this.prisma.characterOperator.create({ data: characterOperator });
      }
    });
  }

  private async rewardCsb(
    address: string,
    /** ethers in string */
    amount: bigint,
  ) {
    try {
      // check current $CSB before send
      const user = await this.prisma.opSignUser.findUnique({
        where: { address },
        select: { csbRecharged: true, csbSpent: true },
      });
      if (user) {
        const currentCsb = BigInt(user.csbRecharged) - BigInt(user.csbSpent);

        if (currentCsb > amount) {
          this.logger.warn(
            `Skip sending CSB to ${address}: current $CSB is ${currentCsb.toString()}`,
          );
          return;
        }
      } else {
        this.logger.warn(`Skip sending CSB to ${address}: user not found`);
        return;
      }

      // send
      const newCsb = BigInt(user.csbRecharged) + amount;
      return await this.prisma.opSignUser.update({
        where: { address },
        data: { csbRecharged: newCsb.toString() },
      });
    } catch (e: any) {
      this.logger.error(`Failed to send CSB to ${address}: ${e.message}`);
    }
  }
}
