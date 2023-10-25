import { ethers } from 'ethers';

export const NIL_ADDRESS = '0x0000000000000000000000000000000000000000';

export const isAddressEqual = (a: string, b: string) => {
  return a?.toLowerCase?.() === b?.toLowerCase?.();
};

export const isAddress = (address: string) => {
  return ethers.utils.isAddress(address);
};
