import { Injectable, Logger } from '@nestjs/common';
import { SiweTransactionBaseService } from '../base/base.service';

@Injectable()
export class SiweLinkService extends SiweTransactionBaseService {
  private readonly logger = new Logger(SiweLinkService.name);

  async linkCharacter(
    address: `0x${string}`,
    fromCharacterId: number,
    toCharacterId: number,
    linkType: string,
    data?: `0x${string}`,
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.link.linkCharacter(
          { fromCharacterId, toCharacterId, linkType, data },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async linkCharactersInBatch(
    address: `0x${string}`,
    fromCharacterId: number,
    toCharacterIds: number[],
    toAddresses: `0x${string}`[],
    linkType: string,
    data?: `0x${string}`[],
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.link.linkCharactersInBatch(
          { fromCharacterId, toCharacterIds, toAddresses, linkType, data },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async createThenLinkCharacter(
    address: `0x${string}`,
    fromCharacterId: number,
    toAddress: `0x${string}`,
    linkType: string,
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.link.createThenLinkCharacter(
          { fromCharacterId, toAddress, linkType },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async unlinkCharacter(
    address: `0x${string}`,
    fromCharacterId: number,
    toCharacterId: number,
    linkType: string,
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.link.unlinkCharacter(
          { fromCharacterId, toCharacterId, linkType },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async linkNote(
    address: `0x${string}`,
    fromCharacterId: number,
    toCharacterId: number,
    toNoteId: number,
    linkType: string,
    data?: `0x${string}`,
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.link.linkNote(
          { fromCharacterId, toCharacterId, toNoteId, linkType, data },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async unlinkNote(
    address: `0x${string}`,
    fromCharacterId: number,
    toCharacterId: number,
    toNoteId: number,
    linkType: string,
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.link.unlinkNote(
          { fromCharacterId, toCharacterId, toNoteId, linkType },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }
}
