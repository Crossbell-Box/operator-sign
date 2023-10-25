import { CrossbellContractModule } from '@/module/contract/contract.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { JWT_SECRET } from './siwe.constants';
import { SiweController } from './siwe.controller';
import { SiweService } from './siwe.service';
import { SiweJwtStrategy } from './siwe.strategy';

@Module({
  imports: [
    PrismaModule,
    CrossbellContractModule,
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '3650d' },
    }),
  ],
  controllers: [SiweController],
  providers: [SiweService, SiweJwtStrategy],
})
export class SiweModule {}
