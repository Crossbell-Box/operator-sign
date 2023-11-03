import {
  Body,
  Controller,
  Get,
  Post,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiweAuthGuard } from './siwe.guard';
import { SiweService } from './siwe.service';
import { SiweChallengeBody, SiweLoginBody } from './siwe.dto';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { type FastifyReply } from 'fastify';
import { ApiBearerAuthSiwe, CurrentUser } from './siwe.decorator';
import { CurrentOpSignUser } from './siwe.type';
import { Throttle, minutes } from '@nestjs/throttler';

@Controller({
  path: '/',
  version: '1',
})
@ApiTags('Siwe')
export class SiweController {
  constructor(private siweService: SiweService) {}

  @Post('/challenge')
  @ApiOperation({ summary: 'Generate a challenge' })
  async genNonce(
    @Body() body: SiweChallengeBody,
  ): Promise<{ message: string }> {
    const { address, domain, uri, statement } = body;
    const message = await this.siweService.generateChallenge({
      address,
      domain,
      uri,
      statement,
    });
    return { message };
  }

  @Throttle({ default: { ttl: minutes(5), limit: 5 } }) // 5 requests per 5 minutes
  @Post('/login')
  @ApiOperation({ summary: 'Login' })
  async login(@Body() body: SiweLoginBody): Promise<{ token: string }> {
    const { address, signature } = body;
    const token = await this.siweService.login(address, signature);
    return { token };
  }

  @Get('/account')
  @ApiOperation({ summary: 'Get the current user' })
  @ApiBearerAuthSiwe()
  @UseGuards(SiweAuthGuard)
  async getMe(
    @CurrentUser() user: CurrentOpSignUser,
  ): Promise<{ address: string }> {
    return user;
  }

  private demoHtmlCache?: string;
  @Get('/demo')
  @ApiOperation({ summary: 'Demo App' })
  async demo(@Response() res: FastifyReply) {
    let demoHtml: string;
    if (process.env.NODE_ENV === 'production' && this.demoHtmlCache) {
      demoHtml = this.demoHtmlCache;
    } else {
      demoHtml = await readFile(
        resolve(__dirname, './siwe.demo.html'),
        'utf-8',
      );
    }

    res.status(200).header('Content-Type', 'text/html').send(demoHtml);
  }
}
