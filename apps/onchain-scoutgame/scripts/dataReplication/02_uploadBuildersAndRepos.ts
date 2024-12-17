import { getScoutProtocolBuilderNFTContract, validateIsNotProductionDatabase } from "./utils";
import { scouts } from "./cache/scouts";
import { prisma } from "@charmverse/core/prisma-client";
import { log } from "@charmverse/core/log";
import { prettyPrint } from "@packages/utils/strings";
import { generateWallet } from "@packages/blockchain/generateWallet";
import fs from 'node:fs';

import { repos } from "./cache/repos";

async function uploadBuildersAndRepos() {
  validateIsNotProductionDatabase();

  for (let i = 0; i < scouts.length; i++) {
    const {builderNfts, githubUsers, ...scout} = scouts[i];

    log.info(`Processing scout ${i + 1} of ${scouts.length}`);

    const builderNFTContract = getScoutProtocolBuilderNFTContract();

    const builderTokenId = await builderNFTContract.getTokenIdForBuilder({args: {builderId: scout.id}})
    .catch(async (e) => {
      const isMissingBuilderError = !!String(e).match('Builder not registered');

      if (!isMissingBuilderError) {
        throw e;
      }

      const wallet = await generateWallet(scout.id);

      log.info(`Generated wallet for ${scout.id} - ${wallet.account}`);

      await builderNFTContract.registerBuilderToken({args: {builderId: scout.id, account: wallet.account}});

      const newTokenId = await builderNFTContract.getTokenIdForBuilder({args: {builderId: scout.id}});

      log.info(`New token id for ${scout.id} - ${newTokenId}`);

      return newTokenId;

    });


    await prisma.scout.upsert({
      where: {
        id: scout.id
      },
      update: {
      },
      create: {
        ...scout,
        telegramId: Number(scout.telegramId),
        builderNfts: {
          createMany: {
            data: builderNfts.map(({builderId, ...builderNft}) => ({
              ...builderNft,
              tokenId: Number(builderNft.tokenId),
              currentPrice: BigInt(Number(builderNft.currentPrice))
            }))
          }
        },
        githubUsers: {
          createMany: {
            data: githubUsers.map(({builderId, ...githubUser}) => ({
              ...githubUser
            }))
          }
        }
      }
    })
  }
}

uploadBuildersAndRepos();