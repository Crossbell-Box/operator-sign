import { Logger } from '@nestjs/common';
import { Semaphore } from 'async-mutex';
import { isURL } from 'class-validator';
import { request } from 'undici';
import retry from 'async-retry';
import {
  DEFAULT_IPFS_GATEWAYS,
  ipfsFetch,
  IpfsGatewayTemplate,
  isIpfsUrl,
} from '@crossbell/ipfs-fetch';

const logger = new Logger('http::client');

const semaphore = new Semaphore(50);

const gateways: IpfsGatewayTemplate[] = [
  ...DEFAULT_IPFS_GATEWAYS,
  'https://ipfs.rss3.page/ipfs/{cid}{pathToResource}',
];

export async function requestJson(url: string): Promise<object | undefined> {
  if (url.trim().length === 0) {
    return undefined;
  }

  if (
    !isURL(url, {
      protocols: ['http', 'https', 'ipfs'],
      require_host: false,
      require_tld: false,
    })
  ) {
    return undefined;
  }

  let res: object | undefined;
  let str: string | undefined;
  try {
    await semaphore.runExclusive(async (value) => {
      str = await retry(
        async (bail) => {
          if (isIpfsUrl(url)) {
            const res = await ipfsFetch(url, { gateways });
            if (res.status === 403) {
              bail(new Error('403 Unauthorized'));
            }

            const text = await res.text();
            return text;
          } else {
            const { body, statusCode } = await request(url);
            if (statusCode === 403) {
              bail(new Error('403 Unauthorized'));
            }

            const text = await body.text();
            return text;
          }
        },
        { retries: 5 },
      );
      res = JSON.parse(str ?? '');
    });
    return res;
  } catch (e: any) {
    logger.warn('requestJson failed: %o', {
      url,
      res: str?.slice(0, 50),
      err: e.message,
    });
    return undefined;
  }
}
