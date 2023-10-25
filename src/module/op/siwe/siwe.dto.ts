import { ToLowerCase } from '@/utils/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional, IsUrl } from 'class-validator';

export class SiweChallengeBody {
  @ApiProperty({ description: 'Address' })
  @IsEthereumAddress()
  @ToLowerCase()
  address!: `0x${string}`;

  @ApiProperty({ description: "Current app's domain" })
  @IsUrl()
  domain!: string;

  @ApiProperty({ description: "Current app page's uri" })
  @IsUrl()
  uri!: string;

  @ApiProperty({ description: 'Statement', required: false })
  @IsOptional()
  statement: string = 'Sign-in with Crossbell (or Ethereum)';
}

export class SiweLoginBody {
  @ApiProperty({ description: 'Address' })
  @IsEthereumAddress()
  @ToLowerCase()
  address!: `0x${string}`;

  @ApiProperty({ description: 'Signature' })
  signature!: string;
}
