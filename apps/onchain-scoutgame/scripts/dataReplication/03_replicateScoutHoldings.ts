// // @ts-nocheck

// import { log } from "@charmverse/core/log";
// import { prisma } from "@charmverse/core/prisma-client";
// import { getBuilderScoutedEvents } from "@packages/scoutgame/builderNfts/accounting/getBuilderScoutedEvents";
// import { Address } from "viem";
// import {  validateIsNotProductionDatabase } from "./utils";
// import { getScoutAdminWalletClient, getScoutProtocolBuilderNFTContract, getScoutTokenERC20Contract, scoutProtocolBuilderNftContractAddress } from "@packages/scoutgame/protocol/constants";

// // Commented this blob so CI passes. Re-enable when performing upload
// import { scouts } from "./cache/scouts";
// // Stubs for typecheck to pass
// // const scouts = [] as any[];

// validateIsNotProductionDatabase();


// const realBuilderNftContract = '0x743ec903FE6D05E73b19a6DB807271bb66100e83';

// async function fundScouts() {
//   const tokenContract = getScoutTokenERC20Contract();

//   const minBalance = BigInt(200_0000) * BigInt(10**18); // 10,000 with 18 decimals

//   for (const scout of scouts) {
//     const scoutWallet = scout.wallets[0].address;

//     log.info(`Checking balance for scout ${scout.id} at ${scoutWallet}`);

//     const currentBalance = await tokenContract.balanceOf({
//       args: {
//         account: scoutWallet
//       }
//     });

//     log.info(`Current balance: ${currentBalance / BigInt(10**18)}`);

//     if (currentBalance < minBalance) {
//       const amountToSend = minBalance - currentBalance;
      
//       log.info(`Transferring ${amountToSend} tokens to scout ${scout.id}`);

//       await tokenContract.transfer({
//         args: {
//           to: scoutWallet,
//           value: amountToSend
//         }
//       });

//       await new Promise(resolve => setTimeout(resolve, 300));

//       log.info(`Successfully transferred ${amountToSend / BigInt(10**18)} tokens to scout ${scout.id}`);
//     } else {
//       log.info(`Scout ${scout.id} already has sufficient balance: ${currentBalance}`);
//     }
//   }
// }

// async function replicateScoutHoldings() {
//   const builderScoutedEvents = await getBuilderScoutedEvents({
//     contractAddress: realBuilderNftContract,
//     fromBlock: 126_000_000
//   });

//   console.log(builderScoutedEvents.length)
  
//   const scoutsFromDb = await prisma.scout.findMany({
//     where: {
//       id: {
//         in: scouts.map(scout => scout.id)
//       }
//     }
//   });

//   /**
//    * Token mappings are a map of scoutId to the tokens they hold
//    */
//   const tokenMappings = builderScoutedEvents.reduce((acc, val) => {
//     const scoutId = val.args.scout;

//     // If the scout is not in the database, skip
//     if (!scoutsFromDb.find(s => s.id === scoutId)) {
//       return acc;
//     }

//     const tokenId = Number(val.args.tokenId);
//     const amount = Number(val.args.amount);

//     if (!acc[scoutId]) {
//       acc[scoutId] = {
//         builders: 0,
//         tokens: {}
//       };
//     }

//     if (!acc[scoutId].tokens[tokenId]) {
//       acc[scoutId].builders += 1;
//       acc[scoutId].tokens[tokenId] = 0;
//     }

//     // Add to existing amount or initialize
//     acc[scoutId].tokens[tokenId] += amount;

//     return acc;


//   }, {} as Record<string, {builders: number; tokens: {[key: number]: number}}>);

//   const adminAccount = getScoutAdminWalletClient();

//   const nftContractAddress = scoutProtocolBuilderNftContractAddress();

//   const nftContract = getScoutProtocolBuilderNFTContract();
//   const tokenContract = getScoutTokenERC20Contract();
 
//   const balance = await tokenContract.balanceOf({
//     args: {
//       account: adminAccount.account.address
//     }
//   });


//   const balanceWithoutDecimals = Number(balance) / 10**18;

//   log.info(`Approving ${balanceWithoutDecimals.toLocaleString()} tokens to the NFT contract`);

//   await tokenContract.approve({
//     args: {
//       spender: nftContractAddress,
//       value: balance
//     }
//   });

//   const userTokens = Object.entries(tokenMappings);

//   for (let i = 0; i < userTokens.length; i++) {

//     const [scoutId, {tokens}] = userTokens[i];

//     log.info(`Processing scout ${i + 1} of ${userTokens.length}`);

//     const adminNftBalances = await nftContract.balanceOfBatch({
//       args: {
//         accounts: Array.from({length: Object.keys(tokens).length}, () => adminAccount.account.address),
//         tokenIds: Object.keys(tokens).map(tokenId => BigInt(tokenId))
//       }
//     });

//     const scout = scouts.find(s => s.id === scoutId);

//     const scoutWallet = scout?.wallets[0];

//     if (!scoutWallet) {
//       throw new Error(`Scout ${scoutId} does not have a wallet`);
//     }

//     const tokenHoldings = Object.entries(tokens);

//     const tokenHoldingsWithIds = tokenHoldings.map(_token => Number(_token[0]));

//     const userBalances = await nftContract.balanceOfBatch({
//       args: {
//         accounts: Array.from({length: tokenHoldings.length}, () => scoutWallet.address),
//         tokenIds: tokenHoldingsWithIds.map(tokenId => BigInt(tokenId))
//       }
//     });

//     const newlyMintedNfts: {amount: number; tokenId: number}[] = [];

//     for (let i = 0; i < userBalances.length; i++) {

//       const tokenId = tokenHoldings[i][0];
//       const expectedAmount = tokenHoldings[i][1];
//       const amount = Number(userBalances[i]);

//       if (amount < expectedAmount) {
//         const missingAmount = expectedAmount - amount;

//         log.info(`Need ${missingAmount} NFTs with tokenId ${tokenId}`);

//         // Check if admin has enough balance of this token
//         const adminBalance = Number(adminNftBalances[i]);

//         if (adminBalance < missingAmount) {
//           log.info(`Admin balance of ${adminBalance} for tokenId ${tokenId} is insufficient. Need to mint ${missingAmount - adminBalance} more`);

//           // First mint then transfer. This ensures we have a dataset with none minted NFT transfers, enabling us to replicate the situation where NFTs move around
//           await nftContract.mint({
//             args: {
//               account: adminAccount.account.address as Address,
//               tokenId: BigInt(tokenId),
//               amount: BigInt(missingAmount)
//             }
//           });

//           await new Promise(resolve => setTimeout(resolve, 300));
//         }
        
//         newlyMintedNfts.push({
//           amount: missingAmount,
//           tokenId: Number(tokenId)
//         });
//       }
//     }

//     if (newlyMintedNfts.length) {
//       // Randomise the transfer method, using atomic transfers of NFTs OR batch transfers
//       if (Math.random() < 0.5) {
//         log.info(`${newlyMintedNfts.length} atomic transfers for scout ${scoutId}`);

//         for (let i = 0; i < newlyMintedNfts.length; i++) {

//           log.info(`Transferring ${newlyMintedNfts[i].amount} NFTs with tokenId ${newlyMintedNfts[i].tokenId} to scout ${scoutId}`);
//           await nftContract.safeTransferFrom({
//             args: {
//               from: adminAccount.account.address as Address,
//               to: scoutWallet.address as Address,
//               tokenId: BigInt(newlyMintedNfts[i].tokenId),
//               amount: BigInt(newlyMintedNfts[i].amount),
//               data: '0x'
//             }
//           });

//           await new Promise(resolve => setTimeout(resolve, 300));
//         }
//       } else {
//         log.info(`Batch transfer for scout ${scoutId}`);

//         const tokenIds = newlyMintedNfts.map(nft => BigInt(nft.tokenId));
//         const amounts = newlyMintedNfts.map(nft => BigInt(nft.amount));

//         log.info(`Transferring ${tokenIds.length} NFTs with tokenIds ${tokenIds.join(', ')} and amounts ${amounts.join(', ')} to scout ${scoutId}`);

//         await nftContract.safeBatchTransferFrom({
//           args: {
//             from: adminAccount.account.address as Address,
//             to: scoutWallet.address as Address,
//             tokenIds,
//             amounts,
//             data: '0x'
//           }
//         });
//       }
//     };

//     const builderNfts = await prisma.builderNft.findMany({
//       where: {
//         contractAddress: scoutProtocolBuilderNftContractAddress(),
//         tokenId: {
//           in: Object.keys(tokens).map(tokenId => Number(tokenId))
//         }
//       }
//     });

//     await prisma.$transaction(async (tx) => {

//       await Promise.all(
//         tokenHoldingsWithIds.map(async (tokenId, index) => {

//           const matchingBuilderNft = builderNfts.find(nft => nft.tokenId === tokenId);

//           if (!matchingBuilderNft) {
//             log.info(`Builder NFT with tokenId ${tokenId} not found`);
//             return Promise.resolve(null);
//           }

//           await tx.scoutNft.upsert({
//             where: {
//               builderNftId_walletAddress: {
//                 builderNftId: matchingBuilderNft.id,
//                 walletAddress: scoutWallet.address
//               }
//             },
//             update: {
//               balance: tokenHoldings[index][1]
//             },
//             create: {
//               builderNftId: matchingBuilderNft.id,
//               walletAddress: scoutWallet.address,
//               balance: tokenHoldings[index][1]
//             }
//           });
//         })
//       );
//     });
//   }
// }

// async function script() {
//   await replicateScoutHoldings();
//   await fundScouts();
// }


// script();

