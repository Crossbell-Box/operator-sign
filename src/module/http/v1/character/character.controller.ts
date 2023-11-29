import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CharacterIdParam } from '../base/base.dto';
import {
  CharacterOperatorIdParam,
  CharacterOperatorsQuery,
  CharacterOperatorsResponse,
} from './character.dto';
import { CharacterOperatorEntity } from '../../generated';
import { CharacterService } from './character.service';

@Controller({
  path: '/',
  version: '1',
})
@ApiTags('Character')
export class CharacterController {
  constructor(private readonly operatorService: CharacterService) {}

  @Get('/characters/:characterId/operators')
  @ApiOperation({ summary: 'Get operators of a character' })
  async getCharacterOperators(
    @Param() param: CharacterIdParam,
    @Query() query: CharacterOperatorsQuery,
  ): Promise<CharacterOperatorsResponse> {
    const { characterId } = param;
    const { cursor, limit } = query;

    return this.operatorService.findManyCharacterOperators(
      { characterId },
      { cursor, limit },
    );
  }

  @Get('/characters/:characterId/operators/:address')
  @ApiOperation({ summary: 'Get a character operator' })
  async getCharacterOperator(
    @Param() param: CharacterOperatorIdParam,
  ): Promise<CharacterOperatorEntity | null> {
    const { characterId, address } = param;

    return this.operatorService.findCharacterOperator(characterId, address);
  }
}
