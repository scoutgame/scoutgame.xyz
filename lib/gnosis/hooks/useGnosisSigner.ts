import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';

// a wrapper around account and library from web3react
export default function useGnosisSigner () {

  const { account, library } = useWeb3React();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (account && library) {
      setSigner(library.getSigner(account));
    }
  }, [account, library]);

  return signer;
}
