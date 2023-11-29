import { CharacterOperatorEntity } from '@/module/http/generated';
import { ToLowerCase } from '@/utils/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';
import {
  CharacterIdParam,
  ListResponse,
  PaginationQuery,
} from '../base/base.dto';

export class CharacterOperatorsResponse extends ListResponse<CharacterOperatorEntity> {
  list!: CharacterOperatorEntity[];
}

export class CharacterOperatorsQuery extends PaginationQuery {}

export class CharacterOperatorIdParam extends CharacterIdParam {
  @ApiProperty({ description: 'Operator address' })
  @IsEthereumAddress()
  @ToLowerCase()
  address!: string;
}
