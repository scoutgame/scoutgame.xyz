import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { getAddress } from 'viem';

import { PublicLockV13 } from 'lib/tokenGates/unlock/abi';
import { isNumber } from 'lib/utilities/numbers';

import { getPublicClient } from '../../blockchain/publicClient';
import type { Lock } from '../interfaces';

import { getLockMetadata } from './getLockMetadata';

type GetLockPayload = {
  chainId: number;
  contract: string;
  walletAddress?: string;
};

export async function getLockDetails(
  values: GetLockPayload,
  withMetadata?: boolean
): Promise<Lock & { validKey?: boolean }> {
  const { chainId: initialChain, contract, walletAddress } = values;

  if (!isNumber(Number(initialChain))) {
    throw new InvalidInputError('Chain must be a number');
  }

  // Validate address and throw an error if it's not
  const address = getAddress(contract);

  const chainId = Number(initialChain);

  try {
    const publicClient = getPublicClient(chainId);

    const name = await publicClient.readContract({
      address,
      abi: PublicLockV13,
      functionName: 'name'
    });

    const locksmithData = withMetadata ? await getLockMetadata({ contract, chainId }) : undefined;

    const lockMetadata: Lock = {
      name,
      contract,
      chainId,
      image: locksmithData?.image
    };

    if (walletAddress) {
      const wallet = getAddress(walletAddress);

      const validKey = await publicClient.readContract({
        address,
        abi: PublicLockV13,
        functionName: 'getHasValidKey',
        args: [wallet]
      });

      return {
        ...lockMetadata,
        validKey
      };
    }

    return lockMetadata;
  } catch (error: any) {
    throw new DataNotFoundError('Error fetching lock details. Check the contract address and chain.');
  }
}
