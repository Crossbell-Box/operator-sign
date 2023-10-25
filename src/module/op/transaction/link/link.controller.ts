import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiweLinkService } from './link.service';
import {
  LinkCharacterBody,
  LinkCharacterParam,
  LinkCharacterResponse,
  LinkCharactersInBatchBody,
  LinkNoteBody,
  LinkNoteParam,
  LinkNoteResponse,
  UnlinkCharacterParam,
  UnlinkCharacterResponse,
  UnlinkNoteParam,
  UnlinkNoteResponse,
} from './link.dto';
import { WebException } from '@/utils/exception';
import { isAddress } from 'ethers/lib/utils';
import { SiweAuthGuard } from '../../siwe/siwe.guard';
import { ApiBearerAuthSiwe, CurrentUser } from '../../siwe/siwe.decorator';
import { CharacterIdParam } from '@/module/http/v1/base/base.dto';
import { CurrentOpSignUser } from '../../siwe/siwe.type';

@Controller({
  path: '/',
  version: '1',
})
@ApiTags('Siwe')
@ApiBearerAuthSiwe()
@UseGuards(SiweAuthGuard)
export class SiweLinkController {
  constructor(private readonly linkService: SiweLinkService) {}

  @Put(
    '/siwe/contract/characters/:characterId/links/characters/:toCharacterIdOrToAddress/:linkType',
  )
  @ApiOperation({ summary: 'Link a character' })
  async linkCharacter(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: LinkCharacterParam,
    @Body() body: LinkCharacterBody,
  ): Promise<LinkCharacterResponse> {
    const { characterId, toCharacterIdOrToAddress, linkType } = param;
    const { data } = body;
    const { address } = user;

    const isToAddress = isAddress(toCharacterIdOrToAddress.toString());

    if (!isToAddress) {
      const res = await this.linkService.linkCharacter(
        address,
        characterId,
        Number(toCharacterIdOrToAddress),
        linkType,
        data,
      );

      return {
        data: { linklistId: Number(res.data) },
        transactionHash: res.transactionHash,
      };
    } else if (isToAddress) {
      const res = await this.linkService.createThenLinkCharacter(
        address,
        characterId,
        toCharacterIdOrToAddress.toString() as `0x${string}`,
        linkType,
      );

      return {
        data: {
          linklistId: Number(res.data.linklistId),
          toCharacterId: Number(res.data.toCharacterId),
        },
        transactionHash: res.transactionHash,
      };
    } else {
      throw new WebException(
        'Invalid toCharacterIdOrToAddress. Should be number or string.',
      );
    }
  }

  @Put('/siwe/contract/characters/:characterId/links/characters')
  @ApiOperation({ summary: 'Link characters in batch' })
  async linkCharactersInBatch(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: CharacterIdParam,
    @Body() body: LinkCharactersInBatchBody,
  ): Promise<LinkCharacterResponse> {
    const { characterId } = param;
    const { toCharacterIds, toAddresses, linkType, data } = body;
    const { address } = user;

    const res = await this.linkService.linkCharactersInBatch(
      address,
      characterId,
      toCharacterIds,
      toAddresses,
      linkType,
      data,
    );

    return {
      data: { linklistId: Number(res.data) },
      transactionHash: res.transactionHash,
    };
  }

  @Delete(
    '/siwe/contract/characters/:characterId/links/characters/:toCharacterId/:linkType',
  )
  @ApiOperation({ summary: 'Unlink a character' })
  async unlinkCharacter(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: UnlinkCharacterParam,
  ): Promise<UnlinkCharacterResponse> {
    const { characterId, toCharacterId, linkType } = param;
    const { address } = user;

    const res = await this.linkService.unlinkCharacter(
      address,
      characterId,
      toCharacterId,
      linkType,
    );

    return {
      data: true,
      transactionHash: res.transactionHash,
    };
  }

  @Put(
    '/siwe/contract/characters/:characterId/links/notes/:toCharacterId/:toNoteId/:linkType',
  )
  @ApiOperation({ summary: 'Link a note' })
  async linkNote(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: LinkNoteParam,
    @Body() body: LinkNoteBody,
  ): Promise<LinkNoteResponse> {
    const { characterId, toCharacterId, toNoteId, linkType } = param;
    const { data } = body;
    const { address } = user;

    const res = await this.linkService.linkNote(
      address,
      characterId,
      toCharacterId,
      toNoteId,
      linkType,
      data,
    );

    return {
      data: { linklistId: Number(res.data) },
      transactionHash: res.transactionHash,
    };
  }

  @Delete(
    '/siwe/contract/characters/:characterId/links/notes/:toCharacterId/:toNoteId/:linkType',
  )
  @ApiOperation({ summary: 'Unlink a note' })
  async unlinkNote(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: UnlinkNoteParam,
  ): Promise<UnlinkNoteResponse> {
    const { characterId, toCharacterId, toNoteId, linkType } = param;
    const { address } = user;

    const res = await this.linkService.unlinkNote(
      address,
      characterId,
      toCharacterId,
      toNoteId,
      linkType,
    );

    return {
      data: true,
      transactionHash: res.transactionHash,
    };
  }
}
