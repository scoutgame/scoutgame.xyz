'use server';

import { getContractDeployerAddress } from '@packages/blockchain/getContractDeployerAddress';
import { actionClient } from '@packages/nextjs/actions/actionClient';

import { getContractDeployerAddressSchema } from './getContractDeployerAddressSchema';

export const getContractDeployerAddressAction = actionClient
  .metadata({ actionName: 'get-contract-deployer-address' })
  .schema(getContractDeployerAddressSchema)
  .action(async ({ parsedInput }) => {
    const { transaction } = await getContractDeployerAddress({
      contractAddress: parsedInput.contractAddress,
      chainId: parsedInput.chainId
    });

    return transaction.from;
  });
