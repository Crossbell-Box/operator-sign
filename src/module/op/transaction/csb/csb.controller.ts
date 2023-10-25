import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCsbBalanceResponse } from './csb.dto';
import { SiweCsbService } from './csb.service';
import { SiweAuthGuard } from '../../siwe/siwe.guard';
import { ApiBearerAuthSiwe, CurrentUser } from '../../siwe/siwe.decorator';
import { CurrentOpSignUser } from '../../siwe/siwe.type';

@Controller({
  path: '/',
  version: '1',
})
@ApiTags('Siwe')
@ApiBearerAuthSiwe()
@UseGuards(SiweAuthGuard)
export class SiweCsbController {
  constructor(private readonly csbService: SiweCsbService) {}

  @Get('/siwe/account/balance')
  @ApiOperation({ summary: 'Get the balance of csb' })
  async getCsbBalance(
    @CurrentUser() user: CurrentOpSignUser,
  ): Promise<GetCsbBalanceResponse> {
    const { address } = user;
    const res = await this.csbService.getCurrentCsb(address);

    return {
      balance: res,
    };
  }
}
