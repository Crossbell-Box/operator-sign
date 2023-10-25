
import {CharacterOperatorPermission} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateCharacterOperatorDto {
  characterId?: number;
operator?: string;
@ApiProperty({ enum: CharacterOperatorPermission, isArray: true })permissions?: CharacterOperatorPermission[];
createdAt?: Date;
updatedAt?: Date;
transactionHash?: string;
blockNumber?: number;
logIndex?: number;
updatedTransactionHash?: string;
updatedBlockNumber?: number;
updatedLogIndex?: number;
}
