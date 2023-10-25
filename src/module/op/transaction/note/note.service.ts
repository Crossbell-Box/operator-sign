import { Injectable, Logger } from '@nestjs/common';
import { NoteMetadata } from 'crossbell';
import { SiweTransactionBaseService } from '../base/base.service';
import { deepMerge } from '../base/util';

@Injectable()
export class SiweNoteService extends SiweTransactionBaseService {
  private readonly logger = new Logger(SiweNoteService.name);

  async postNote(
    address: `0x${string}`,
    fromCharacterId: number,
    metadata: NoteMetadata,
    { locked }: { locked?: boolean } = {},
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.note.post(
          {
            characterId: fromCharacterId,
            metadataOrUri: metadata,
            locked,
          },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async postNoteForNote(
    address: `0x${string}`,
    fromCharacterId: number,
    metadata: NoteMetadata,
    toCharacterId: number,
    toNoteId: number,
    { locked }: { locked?: boolean } = {},
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.note.postForNote(
          {
            characterId: fromCharacterId,
            metadataOrUri: metadata,
            targetCharacterId: toCharacterId,
            targetNoteId: toNoteId,
            locked,
          },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async postNoteForAnyUri(
    address: `0x${string}`,
    fromCharacterId: number,
    metadata: NoteMetadata,
    toUri: string,
    { locked }: { locked?: boolean } = {},
  ) {
    const res = await this.useContract(
      address,
      fromCharacterId,
      async (contract) => {
        return contract.note.postForAnyUri(
          {
            characterId: fromCharacterId,
            metadataOrUri: metadata,
            targetUri: toUri,
            locked,
          },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async setNoteMetadata(
    address: `0x${string}`,
    characterId: number,
    noteId: number,
    metadata: NoteMetadata,
  ) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.note.setMetadata(
          { characterId, noteId, metadata },
          {
            nonce: await this.getNonce(),
          },
        );
      },
    );

    return res;
  }

  async changeNoteMetadata(
    address: `0x${string}`,
    characterId: number,
    noteId: number,
    metadata: NoteMetadata,
  ) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.note.changeMetadata(
          {
            characterId,
            noteId,
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

  async lockNote(address: `0x${string}`, characterId: number, noteId: number) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.note.lock(
          { characterId, noteId },
          { nonce: await this.getNonce() },
        );
      },
    );

    return res;
  }

  async deleteNote(
    address: `0x${string}`,
    characterId: number,
    noteId: number,
  ) {
    const res = await this.useContract(
      address,
      characterId,
      async (contract) => {
        return contract.note.delete(
          { characterId, noteId },
          {
            nonce: await this.getNonce(),
          },
        );
      },
    );

    return res;
  }

  async mintNote(
    address: `0x${string}`,
    noteCharacterId: number,
    noteId: number,
  ) {
    const res = await this.useContract(address, undefined, async (contract) => {
      const nonce = await this.getNonce();

      return contract.note.mint(
        { characterId: noteCharacterId, noteId, toAddress: address },
        { nonce },
      );
    });

    return res;
  }
}
