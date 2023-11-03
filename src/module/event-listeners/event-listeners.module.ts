import { Module } from '@nestjs/common';

import { CrossbellContractModule } from '@/module/contract/contract.module';
import { PrismaModule } from '@/module/prisma/prisma.module';

import { OperatorToggleListenersService } from './operator-toggle-listeners.service';

@Module({
  imports: [CrossbellContractModule, PrismaModule],
  providers: [OperatorToggleListenersService],
})
export class EventListenersModule {}
