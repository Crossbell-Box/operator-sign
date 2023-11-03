import { Injectable } from '@nestjs/common';
import { SiweTransactionBaseService } from '../base/base.service';

@Injectable()
export class SiweCsbService extends SiweTransactionBaseService {}
