import {
  ToBoolean,
  CheckFrequency,
  ToSafeNullAndUndefined,
  ToLowerCase,
} from '@/utils/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEthereumAddress, IsInt, IsOptional } from 'class-validator';

const MOCK_ADDRESS = '0xc8b960d09c0078c18dcbe7eb9ab9d816bcca8944';

export class AddressParam {
  @ApiProperty({
    description: 'Ethereum address',
    example: MOCK_ADDRESS,
  })
  @IsEthereumAddress()
  @ToLowerCase()
  address!: string;
}

export class ListResponse<T> {
  list!: T[];

  @ApiProperty({
    description:
      'The total number of items in the list. This is not the same as the number of items in the list.',
  })
  count!: number;

  @ApiProperty({
    description:
      'The cursor for the next page. If null, there is no next page.',
  })
  @Transform((o) => o.value || null)
  cursor!: string | null;
}

export class CharacterIdParam {
  @ApiProperty({
    description: 'Character ID',
    example: 10,
  })
  @IsInt()
  characterId!: number;
}

export class CharacterHandleParam {
  @ApiProperty({
    description: 'Character handle',
    example: 'diygod',
  })
  @ToLowerCase()
  handle!: string;
}

// TODO: a nestjs swagger generating bug with ts-mixin
// export class NoteIdParam {
//   @ApiProperty({
//     description: 'Note ID of a character',
//     example: 4,
//   })
//   @IsInt()
//   noteId: number;
// }
// export class NoteComposedIdParam extends Mixin(CharacterIdParam, NoteIdParam) {}

export class NoteComposedIdParam extends CharacterIdParam {
  @ApiProperty({
    description: 'Note ID of a character',
    example: 4,
  })
  @IsInt()
  noteId!: number;
}

export class MintedNoteComposedIdParam {
  @ApiProperty({
    description: 'Contract address of a minted note',
    example: '0x2f5b8386B6A0E51E00a7903E9d2D3a2fE482f4C0',
  })
  contractAddress!: string;

  @ApiProperty({
    description: 'Token ID of a minted note',
    example: 1,
  })
  @IsInt()
  tokenId!: number;
}

export class Erc721ComposedIdParam {
  @ApiProperty({
    description: 'Contract address of an ERC721 token on the Crossbell network',
    example: '0x2f5b8386B6A0E51E00a7903E9d2D3a2fE482f4C0',
  })
  contractAddress!: string;

  @ApiProperty({
    description: 'Token ID of an ERC721 token on the Crossbell network',
    example: 1,
  })
  @IsInt()
  tokenId!: number;
}

export class LinklistIdParam {
  @ApiProperty({
    description: 'Linklist ID',
    example: 1,
  })
  @IsInt()
  linklistId!: number;
}

export class TransactionHashAndLogIndexParam {
  @ApiProperty({
    description: 'TransactionHash',
    example:
      '0x64644a2f6ec6fd596a77940f0ad5bfc6e18e92bf37f7ead214090c284746525c',
  })
  transactionHash!: string;

  @ApiProperty({
    description: 'LogIndex',
    example: 0,
  })
  @IsInt()
  logIndex!: number;
}

export class FeedIdParam extends TransactionHashAndLogIndexParam {}

export class AnyUriParam {
  @ApiProperty({
    description:
      'Any URI. You may need to [UTF-8 encode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) it if it contains non-ASCII characters.',
    example: 'https://example.com',
  })
  uri!: string;
}

export class NotesMetricsQuery {
  @ApiProperty({
    description: 'How many latest days to calculate detailed statistics',
  })
  @IsInt()
  recent?: number = 7;
}

export class OwnersMetricsQuery {
  @ApiProperty({
    description: 'Whether calculate the total number of the nonTest owners',
  })
  @ToBoolean()
  nonTest?: boolean = true;

  @ApiProperty({
    description:
      'Whether to contain the total owners who has more than 3 characters',
  })
  @ToBoolean()
  outstanding?: boolean = true;

  @ApiProperty({
    description: 'Whether count the total new owners in last 24 hours',
    example: 'daily,weekly,monthly',
  })
  @CheckFrequency()
  frequency?: string;
}

export class CharactersMetricsQuery {
  @ApiProperty({
    description: 'Whether calculate the total number of the nonTest characters',
  })
  @ToBoolean()
  nonTest?: boolean = true;

  @ApiProperty({
    description:
      'Whether count the total number of the active characters.  Active means the characters that at least posted one note.',
  })
  @ToBoolean()
  active?: boolean = true;

  @ApiProperty({
    description: 'What frequency to count the new created characters',
    example: 'daily,weekly,monthly',
  })
  @CheckFrequency()
  frequency?: string;
}

export class PaginationQuery {
  @ApiProperty({ description: 'Cursor to paginate' })
  @IsOptional()
  @ToSafeNullAndUndefined()
  cursor?: string;

  @ApiProperty({ description: 'How many items to return' })
  @IsOptional()
  @IsInt()
  limit?: number = 20;
}
