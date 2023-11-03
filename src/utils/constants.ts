import assert from 'assert';
import { isAddress } from 'viem';

export const CBT_CONTRACT_ADDRESS =
  '0x3D1b588a6Bcd728Bb61570ced6656eA4C05e404f';

export const OP_SIGN_OPERATOR_WALLET_ADDRESS = process.env
  .OP_SIGN_OPERATOR_WALLET_ADDRESS as `0x${string}`;

assert(
  OP_SIGN_OPERATOR_WALLET_ADDRESS,
  'OP_SIGN_OPERATOR_WALLET_ADDRESS is missing from environment variables',
);

assert(
  isAddress(OP_SIGN_OPERATOR_WALLET_ADDRESS),
  `${OP_SIGN_OPERATOR_WALLET_ADDRESS} is not a valid address for OP_SIGN_OPERATOR_WALLET_ADDRESS`,
);
