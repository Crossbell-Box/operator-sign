import { Injectable, Logger } from '@nestjs/common';
import { SiweTransactionBaseService } from '../base/base.service';
import { deepMerge } from '../base/util';

@Injectable()
export class SiweCharacterService extends SiweTransactionBaseService {
  private readonly logger = new Logger(SiweCharacterService.name);

  async setHandle(address: string, characterId: number, handle: string) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.character.setHandle(
          { characterId, handle },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async setMetadata(address: string, characterId: number, metadata: object) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.character.setMetadata(
          { characterId, metadata },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async changeMetadata(address: string, characterId: number, metadata: object) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.character.changeMetadata(
          {
            characterId,
            modifier: (oMetadata) => {
              if (oMetadata) {
                return deepMerge(oMetadata, metadata);
              }
              return metadata;
            },
          },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }
}
