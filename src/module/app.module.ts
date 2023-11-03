import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@songkeys/nestjs-redis';

import { OtelModule } from './otel/otel.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { ThrottleModule } from './throttle/throttle.module';
import { EventListenersModule } from './event-listeners/event-listeners.module';
import { SiweModule } from './siwe/siwe.module';
import { SiweTransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    OtelModule,
    ConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule.forRoot({ config: { url: process.env.REDIS_URL } }),
    ThrottleModule,
    EventEmitterModule.forRoot(),
    SiweModule,
    SiweTransactionModule,
    EventListenersModule,
  ],
})
export class AppModule {}
