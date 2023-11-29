import { Module } from '@nestjs/common';
import { PrismaModule } from '@/module/prisma/prisma.module';

import { CharacterController } from '@/module/http/v1/character/character.controller';
import { CharacterService } from '@/module/http/v1/character/character.service';

@Module({
  imports: [PrismaModule],
  controllers: [CharacterController],
  providers: [CharacterService],
})
export class HttpModule {}
