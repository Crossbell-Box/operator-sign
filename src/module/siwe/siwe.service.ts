import { CrossbellContractService } from '@/module/contract/contract.service';
import { WebException } from '@/utils/exception';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';
import { JwtPayload } from './siwe.type';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { PrismaService } from '@/module/prisma/prisma.service';
import { ethers } from 'ethers';

@Injectable()
export class SiweService {
  private readonly logger = new Logger(SiweService.name);

  private contract = this.contractService.getOrCreateContract('operator-sign');

  constructor(
    protected readonly prisma: PrismaService,
    private readonly contractService: CrossbellContractService,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async generateChallenge({
    address,
    domain,
    uri,
    statement,
  }: {
    address: `0x${string}`;
    domain: string;
    uri: string;
    statement: string;
  }) {
    const nonce = generateNonce();
    // 5 mintues
    const siweMessage = new SiweMessage({
      domain,
      uri,
      address: ethers.utils.getAddress(address), // must meet the checksum format
      statement,
      version: '1',
      chainId: 3737,
      nonce,
      issuedAt: new Date().toISOString(),
    });

    const message = siweMessage.prepareMessage();

    await this.redis.set(`siwe:challenge:${address}`, message, 'EX', 60 * 5);

    return message;
  }

  async getChallenge(address: `0x${string}`) {
    const challenge = await this.redis.get(`siwe:challenge:${address}`);
    if (!challenge) {
      throw new WebException(
        'Challenge not found or expired. Please request a challenge first.',
        { status: HttpStatus.FORBIDDEN },
      );
    }
    return challenge;
  }

  async login(address: `0x${string}`, signature: string) {
    const verified = await this.verifySignature(address, signature);
    if (!verified) {
      throw new WebException('Invalid signature', {
        status: HttpStatus.FORBIDDEN,
      });
    } else {
      const token = await this.getToken(address);
      await this.initUser(address);
      return token;
    }
  }

  private async verifySignature(
    address: `0x${string}`,
    signature: string,
  ): Promise<boolean> {
    const message = await this.getChallenge(address);
    const siweMessage = new SiweMessage(message);
    const siweResponse = await siweMessage.verify(
      { signature: signature },
      { suppressExceptions: true },
    );

    if (siweResponse.success) {
      // const fields = siweResponse.data;

      // // check if the nonce is valid
      // if (fields.nonce !== this.getNonce(session)) {
      //   throw new WebException('Nonce mismatch', {
      //     status: HttpStatus.FORBIDDEN,
      //   });
      // }

      // session.set('siwe', fields);

      // const expires = fields.expirationTime
      //   ? new Date(fields.expirationTime)
      //   : undefined;

      // session.options({
      //   expires,
      // });

      return true;
    } else {
      return false;
    }
  }

  private async getToken(address: `0x${string}`): Promise<string> {
    const jwtPayload: JwtPayload = {
      address,
    };

    const token = await this.jwtService.signAsync(jwtPayload);

    return token;
  }

  private async initUser(address: `0x${string}`): Promise<void> {
    address = address.toLowerCase() as `0x${string}`;
    const user = await this.prisma.opSignUser.findUnique({
      where: { address },
      select: { address: true },
    });
    if (!user) {
      const date = new Date();
      await this.prisma.opSignUser.create({
        data: { address, createdAt: date, updatedAt: date },
      });
    }
  }
}
