import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  LockNoteResponse,
  MintNoteResponse,
  PostNoteBody,
  PostNoteResponse,
  SetNoteMetadataBody,
  SetNoteMetadataResponse,
} from './note.dto';
import { SiweNoteService } from './note.service';
import { WebException } from '@/utils/exception';
import { SiweAuthGuard } from '../../siwe/siwe.guard';
import {
  CharacterIdParam,
  NoteComposedIdParam,
} from '@/module/http/v1/base/base.dto';
import { ApiBearerAuthSiwe, CurrentUser } from '../../siwe/siwe.decorator';
import { CurrentOpSignUser } from '../../siwe/siwe.type';

@Controller({
  path: '/',
  version: '1',
})
@ApiTags('Siwe')
@ApiBearerAuthSiwe()
@UseGuards(SiweAuthGuard)
export class SiweNoteController {
  constructor(private readonly noteService: SiweNoteService) {}

  @Put('/siwe/contract/characters/:characterId/notes')
  @ApiOperation({ summary: 'Post a new note' })
  async postNote(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: CharacterIdParam,
    @Body() body: PostNoteBody,
  ): Promise<PostNoteResponse> {
    const { characterId } = param;
    const { metadata, linkItemType, linkItem, locked } = body;
    const { address } = user;

    if (!linkItemType) {
      const res = await this.noteService.postNote(
        address,
        characterId,
        metadata,
        { locked },
      );

      return {
        data: {
          noteId: Number(res.data.noteId),
        },
        transactionHash: res.transactionHash,
      };
    } else if (linkItemType === 'AnyUri') {
      const res = await this.noteService.postNoteForAnyUri(
        address,
        characterId,
        metadata,
        linkItem?.uri!,
        { locked },
      );

      return {
        data: {
          noteId: Number(res.data.noteId),
        },
        transactionHash: res.transactionHash,
      };
    } else if (linkItemType === 'Note') {
      const res = await this.noteService.postNoteForNote(
        address,
        characterId,
        metadata,
        linkItem?.characterId!,
        linkItem?.noteId!,
        { locked },
      );

      return {
        data: {
          noteId: Number(res.data.noteId),
        },
        transactionHash: res.transactionHash,
      };
    } else {
      // TODO: more link item types
      throw new WebException('Unsupported link item type');
    }
  }

  @Post('/siwe/contract/characters/:characterId/notes/:noteId/metadata')
  @ApiOperation({ summary: 'Set a new metadata for a note' })
  async setNoteMetadata(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: NoteComposedIdParam,
    @Body() body: SetNoteMetadataBody,
  ): Promise<SetNoteMetadataResponse> {
    const { characterId, noteId } = param;
    const { metadata, mode } = body;
    const { address } = user;

    const res =
      mode === 'replace'
        ? await this.noteService.setNoteMetadata(
            address,
            characterId,
            noteId,
            metadata,
          )
        : await this.noteService.changeNoteMetadata(
            address,
            characterId,
            noteId,
            metadata,
          );

    return {
      data: res.data,
      transactionHash: res.transactionHash,
    };
  }

  @Post('/siwe/contract/characters/:characterId/notes/:noteId/lock')
  @ApiOperation({ summary: 'Lock a note' })
  async lockNote(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: NoteComposedIdParam,
  ): Promise<LockNoteResponse> {
    const { characterId, noteId } = param;
    const { address } = user;

    const res = await this.noteService.lockNote(address, characterId, noteId);

    return {
      data: true,
      transactionHash: res.transactionHash,
    };
  }

  @Delete('/siwe/contract/characters/:characterId/notes/:noteId')
  @ApiOperation({ summary: 'Delete a note' })
  async deleteNote(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: NoteComposedIdParam,
  ): Promise<LockNoteResponse> {
    const { characterId, noteId } = param;
    const { address } = user;

    const res = await this.noteService.deleteNote(address, characterId, noteId);

    return {
      data: true,
      transactionHash: res.transactionHash,
    };
  }

  @Put('/siwe/contract/characters/:characterId/notes/:noteId/minted')
  @ApiOperation({ summary: 'Mint a note' })
  async mintNote(
    @CurrentUser() user: CurrentOpSignUser,
    @Param() param: NoteComposedIdParam,
  ): Promise<MintNoteResponse> {
    const { characterId: noteCharacterId, noteId } = param;
    const { address } = user;

    const res = await this.noteService.mintNote(
      address,
      noteCharacterId,
      noteId,
    );

    return {
      data: {
        contractAddress: res.data.contractAddress,
        tokenId: Number(res.data.tokenId),
      },
      transactionHash: res.transactionHash,
    };
  }
}
