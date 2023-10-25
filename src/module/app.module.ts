import { OtelModule } from './otel/otel.module';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { OpModule } from './op/op.module';
import { ThrottleModule } from './throttle/throttle.module';
import { RedisModule } from '@songkeys/nestjs-redis';

@Module({
  imports: [
    OtelModule,
    ConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule.forRoot({ config: { url: process.env.REDIS_URL } }),
    ThrottleModule,
    EventEmitterModule.forRoot(),
    OpModule,
  ],
})
export class AppModule {}
