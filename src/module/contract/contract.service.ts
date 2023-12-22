import { Injectable, Logger } from '@nestjs/common';
import { createContract, Contract } from 'crossbell';
import assert from 'assert';

import { CBT_CONTRACT_ADDRESS } from '@/utils/constants';

export type ContractType = 'readonly' | 'operator-sign';

@Injectable()
export class CrossbellContractService {
  protected readonly logger = new Logger('CrossbellContractService');

  private contracts: Record<string, Contract> = {}; // for singleton

  getOrCreateContract(type: ContractType = 'readonly') {
    if (this.contracts[type]) {
      return this.contracts[type];
    }

    const privateKey = this.getPrivateKey(type);
    const contract = createContract(privateKey, {
      contractAddresses: { cbt: CBT_CONTRACT_ADDRESS },
      rpcUrl: process.env.RPC_ENDPOINT_HTTP,
    });

    this.logger.debug(`Connected wallet (${type}) to Crossbell!`);
    this.contracts[type] = contract;

    return contract;
  }

  private getPrivateKey(type: ContractType) {
    switch (type) {
      case 'readonly': {
        return undefined;
      }

      case 'operator-sign': {
        const privateKey = process.env
          .OP_SIGN_OPERATOR_WALLET_PRIVATE_KEY as `0x${string}`;

        assert(
          privateKey,
          'OP_SIGN_OPERATOR_WALLET_PRIVATE_KEY is missing from environment variables',
        );

        assert(
          privateKey.startsWith('0x'),
          `Invalid OP_SIGN_OPERATOR_WALLET_PRIVATE_KEY format. Please ensure you prepend '0x' to the beginning of your key`,
        );

        return privateKey;
      }
    }
  }
}
