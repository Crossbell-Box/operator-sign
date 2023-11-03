import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiweCharacterService } from './character.service';
import { SetMetadataBody, SetMetadataResponse } from './character.dto';
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
export class SiweCharacterController {
  constructor(private readonly characterService: SiweCharacterService) {}

  @Post('/contract/characters/:characterId/metadata')
  @ApiOperation({ summary: 'Set metadata for character' })
  async setCharacterMetadata(
    @Param() param: CharacterIdParam,
    @CurrentUser() user: CurrentOpSignUser,
    @Body() body: SetMetadataBody,
  ): Promise<SetMetadataResponse> {
    const { characterId } = param;
    const { metadata, mode } = body;
    const { address } = user;

    const res =
      mode === 'replace'
        ? await this.characterService.setMetadata(
            address,
            characterId,
            metadata,
          )
        : await this.characterService.changeMetadata(
            address,
            characterId,
            metadata,
          );

    return {
      data: res.data.uri,
      transactionHash: res.transactionHash,
    };
  }
}
