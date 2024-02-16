import { parseEther } from 'viem';

import type { AccessControlCondition } from 'lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useTokensForm';

export function getTokensUnifiedAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { chain, contract, quantity, check } = values;
  const chainId = Number(chain);
  const amount = parseEther(quantity).toString();

  if (check === 'customToken' && contract) {
    return [
      {
        chain: chainId,
        condition: 'evm',
        contractAddress: contract,
        method: 'balanceOf',
        type: 'ERC20',
        tokenIds: [],
        comparator: '>=',
        quantity: amount
      }
    ];
  }

  if (check === 'token' && contract) {
    return [
      {
        chain: chainId,
        condition: 'evm',
        contractAddress: '',
        type: 'ERC20',
        method: 'balanceOf',
        tokenIds: [],
        comparator: '>=',
        quantity: amount
      }
    ];
  }
}
