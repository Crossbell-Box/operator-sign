import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_SECRET, SIWE_STRATEGY_NAME } from './siwe.constants';
import { PrismaService } from '@/module/prisma/prisma.service';
import { CurrentOpSignUser, JwtPayload } from './siwe.type';

@Injectable()
export class SiweJwtStrategy extends PassportStrategy(
  Strategy,
  SIWE_STRATEGY_NAME,
) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate({ address }: JwtPayload): Promise<CurrentOpSignUser | null> {
    if (!address) return null;
    const user = await this.prisma.opSignUser.findUnique({
      where: { address },
      select: {
        address: true,
      },
    });
    return user as {
      address: `0x${string}`;
    } | null;
  }
}
