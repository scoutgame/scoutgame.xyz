'use client';

import type { EvmTransaction } from '@decent.xyz/box-common';
import { ActionType, ChainId } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSendTransaction } from 'wagmi';

type NFT = {
  id: string;
  name: string;
  image: string;
  price: string;
  contractAddress: string;
};

export function NFTPurchase({ walletAddress }: { walletAddress: string }) {
  return (
    <BoxHooksContextProvider apiKey={process.env.DECENT_API_KEY as string}>
      <NFTPurchaseButton walletAddress={walletAddress} />
    </BoxHooksContextProvider>
  );
}

function NFTPurchaseButton({ walletAddress }: { walletAddress: string }) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { sendTransaction } = useSendTransaction();

  useEffect(() => {
    const fetchNFTs = async () => {
      const mockNFTs: NFT[] = [
        {
          id: '291318',
          name: 'Neutral Cow',
          image: 'https://i.seadn.io/s/raw/files/0f99f7f286b690990ac2738d02e52f2e.png?auto=format&dpr=1&w=1000',
          price: '0.0001',
          contractAddress: '0xbefd018f3864f5bbde665d6dc553e012076a5d44'
        }
      ];
      setNfts(mockNFTs);
    };

    fetchNFTs();
  }, []);

  const filteredNFTs = nfts.filter((nft) => nft.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const { error, isLoading, actionResponse } = useBoxAction({
    enable: !!selectedNFT,
    actionType: ActionType.NftFillAsk,
    sender: walletAddress || '',
    srcToken: '0x0000000000000000000000000000000000000000', // Use native token (ETH)
    srcChainId: ChainId.BASE_SEPOLIA,
    dstToken: '0x0000000000000000000000000000000000000000',
    dstChainId: ChainId.BASE_SEPOLIA,
    slippage: 1, // 1% slippage
    actionConfig: {
      chainId: ChainId.BASE_SEPOLIA,
      contractAddress: selectedNFT?.contractAddress || '0xbefd018f3864f5bbde665d6dc553e012076a5d44',
      tokenId: selectedNFT?.id || '291318'
    }
  });

  const handlePurchase = async () => {
    if (!selectedNFT) return;
    const tx = actionResponse?.tx as EvmTransaction;

    sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value
    });
  };

  return (
    <div>
      <h1>NFT Purchase on Base Testnet</h1>

      <input type='text' placeholder='Search NFTs' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {filteredNFTs.map((nft) => (
          <div key={nft.id} style={{ margin: '10px', cursor: 'pointer' }} onClick={() => setSelectedNFT(nft)}>
            <img src={nft.image} alt={nft.name} style={{ width: '100px', height: '100px' }} />
            <p>{nft.name}</p>
            <p>{nft.price} ETH</p>
          </div>
        ))}
      </div>

      {selectedNFT && (
        <div>
          <h2>Selected NFT: {selectedNFT.name}</h2>
          <p>Price: {selectedNFT.price} ETH</p>
          <Button onClick={handlePurchase} disabled={isLoading}>
            {isLoading ? 'Purchasing...' : 'Purchase NFT'}
          </Button>
        </div>
      )}

      {error instanceof Error ? <Typography color='error'>Error: {(error as Error).message}</Typography> : null}
    </div>
  );
}