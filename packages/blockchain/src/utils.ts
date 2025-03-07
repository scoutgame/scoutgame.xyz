import { getPublicClient } from './getPublicClient';

export async function isSmartContractAddress(address: `0x${string}`, chainId: number) {
  // Check if the wallet address is a smart contract
  const code = await getPublicClient(chainId).getBytecode({
    address: address as `0x${string}`
  });
  return code && code !== '0x' && code !== '0x0';
}
