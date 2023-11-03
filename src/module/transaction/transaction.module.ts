import { CrossbellContractModule } from '@/module/contract/contract.module';
import { CsbManagerModule } from '@/module/csb-manager/csb-manager.module';
import { PrismaModule } from '@/module/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { SiweCharacterController } from './character/character.controller';
import { SiweCharacterService } from './character/character.service';
import { SiweCsbController } from './csb/csb.controller';
import { SiweCsbTransferListener } from './csb/csb.listener';
import { SiweCsbService } from './csb/csb.service';
import { SiweLinkController } from './link/link.controller';
import { SiweLinkService } from './link/link.service';
import { SiweNoteController } from './note/note.controller';
import { SiweNoteService } from './note/note.service';

@Module({
  imports: [
    CsbManagerModule.register({
      defaultCsb: '0.02',
    }),
    CrossbellContractModule,
    PrismaModule,
  ],
  controllers: [
    SiweCharacterController,
    SiweLinkController,
    SiweNoteController,
    SiweCsbController,
  ],
  providers: [
    SiweCharacterService,
    SiweLinkService,
    SiweNoteService,
    SiweCsbService,
    SiweCsbTransferListener,
  ],
})
export class SiweTransactionModule {}
