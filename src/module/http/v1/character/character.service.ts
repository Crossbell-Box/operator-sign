import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/module/prisma/prisma.service';

import { decomposeCursor, getListAndCursor } from '../base/util';
import { CharacterOperatorsResponse } from './character.dto';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async findManyCharacterOperators(
    where: Prisma.CharacterOperatorWhereInput,
    {
      cursor,
      limit = 20,
    }: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<CharacterOperatorsResponse> {
    const [list, count] = await (() => {
      const orderBy: Prisma.Enumerable<Prisma.CharacterOperatorOrderByWithRelationAndSearchRelevanceInput> =
        [{ createdAt: 'desc' }, { characterId: 'desc' }, { operator: 'desc' }];
      const take = limit + 1;

      if (cursor) {
        const [characterId, operator] = decomposeCursor(
          cursor,
          'number',
          'string',
        );

        return Promise.all([
          this.prisma.characterOperator.findMany({
            take,
            where,
            orderBy,
            cursor: { characterId_operator: { characterId, operator } },
          }),
          this.prisma.characterOperator.count({ where }),
        ]);
      } else {
        return Promise.all([
          this.prisma.characterOperator.findMany({ take, where, orderBy }),
          this.prisma.characterOperator.count({ where }),
        ]);
      }
    })();

    return {
      count,
      ...getListAndCursor(list, limit, ['characterId', 'operator']),
    };
  }

  findCharacterOperator(characterId: number, operator: string) {
    return this.prisma.characterOperator.findUnique({
      where: { characterId_operator: { characterId, operator } },
    });
  }
}
