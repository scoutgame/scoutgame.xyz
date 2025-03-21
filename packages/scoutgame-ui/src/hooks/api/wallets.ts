import { useGETImmutable } from '../helpers';

// persist the wallet address for this user or return an error if it belongs to someone else
export function useWalletSanctionCheck(address?: string) {
  return useGETImmutable(address ? `/api/wallets/sanction-check` : null, { address });
}
