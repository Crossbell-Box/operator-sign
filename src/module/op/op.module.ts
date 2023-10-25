import { Module } from '@nestjs/common';
import { SiweModule } from './siwe/siwe.module';
import { SiweTransactionModule } from './transaction/transaction.module';
import { EventListenersModule } from './event-listeners/event-listeners.module';

@Module({
  imports: [SiweModule, SiweTransactionModule, EventListenersModule],
})
export class OpModule {}
