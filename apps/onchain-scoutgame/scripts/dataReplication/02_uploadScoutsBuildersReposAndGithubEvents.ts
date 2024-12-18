import { log } from "@charmverse/core/log";
import { Prisma, prisma } from "@charmverse/core/prisma-client";
import { generateWallet } from "@packages/blockchain/generateWallet";
import { getScoutProtocolBuilderNFTContract, validateIsNotProductionDatabase } from "./utils";
import { v4 as uuid } from 'uuid';

import { builders } from "./cache/builders";
import { repos } from "./cache/repos";
import { githubEvents } from "./cache/githubEvents";
import { builderEvents} from './cache/builderEvents';
import { scouts } from "./cache/scouts";

validateIsNotProductionDatabase();

async function uploadBuildersScoutsAndRepos() {
  // console.log('Deleted', deleted);

  const startTokenId = 28;

  let sortedBuilders = builders.slice().sort((a, b) => a.builderNfts[0]!.tokenId - b.builderNfts[0]!.tokenId);

  let index = sortedBuilders.findIndex(b => b.builderNfts[0]!.tokenId === startTokenId);

  if (index === -1) {
    throw new Error('Start token id not found');
  }

  sortedBuilders = sortedBuilders.slice(index);

  console.log(sortedBuilders.map(b => b.builderNfts[0]!.tokenId));

  // for (let i = 0; i < sortedBuilders.length; i++) {
  //   const {builderNfts, githubUsers, ...builder} = sortedBuilders[i];


  //   const currentTokenId = builderNfts[0]!.tokenId;
  //   log.info('--------------------------------')
  //   log.info(`Processing builder ${i + 1}/${sortedBuilders.length} with id ${builder.id} token id ${currentTokenId}`);

  //   const builderNFTContract = getScoutProtocolBuilderNFTContract();

  //   let contractMaxTokenId = await builderNFTContract.totalBuilderTokens();

  //   const builderTokenId = await builderNFTContract.getTokenIdForBuilder({args: {builderId: builder.id}})
  //   .catch(async (e) => {
  //     const isMissingBuilderError = !!String(e).match('Builder not registered');

  //     if (!isMissingBuilderError) {
  //       throw e;
  //     }

  //     // We should expect max token id to be lower than current token id
  //     if (contractMaxTokenId >= currentTokenId) {
  //       log.error();
  //       throw new Error(`Contract token id ${contractMaxTokenId} does not permit token id ${currentTokenId}`);
  //     }
      
  //     while (contractMaxTokenId < currentTokenId - 1) {

  //       log.info('Adding intermediate empty tokens')

  //       const builderId = uuid()

  //       const wallet = generateWallet(builderId);

  //       await builderNFTContract.registerBuilderToken({args: {builderId, account: wallet.account}});
  //       contractMaxTokenId++;
  //     }

  //     const wallet = await generateWallet(builder.id);

  //     log.info(`Generated wallet for ${builder.id} - ${wallet.account}`);

  //     await builderNFTContract.registerBuilderToken({args: {builderId: builder.id, account: wallet.account}});

  //     const newTokenId = await builderNFTContract.getTokenIdForBuilder({args: {builderId: builder.id}});

  //     log.info(`New token id for ${builder.id} - ${newTokenId}`);

  //     return newTokenId;

  //   });

  //   if (Number(builderTokenId) !== currentTokenId) {
  //     log.error(`Token id ${builderTokenId} does not match current token id ${currentTokenId}`);
  //     throw new Error('Token id does not match current token id');
  //   }

  //   const existingFarcasterIdUser = builder.farcasterId ? await prisma.scout.findFirst({
  //     where: {
  //       farcasterId: builder.farcasterId as number
  //     }
  //   }) : null;

  //   await prisma.githubUser.deleteMany({
  //     where: {
  //       id: {
  //         in: githubUsers.map(({id}) => id)
  //       }
  //     }
  //   })


  //   await prisma.scout.upsert({
  //     where: {
  //       id: builder.id
  //     },
  //     update: {
  //     },
  //     create: {
  //       ...builder,
  //       farcasterId: builder.farcasterId && !existingFarcasterIdUser ? Number(builder.farcasterId) : null,
  //       farcasterName: builder.farcasterName && !existingFarcasterIdUser ? builder.farcasterName : null,
  //       telegramId: builder.telegramId ? Number(builder.telegramId) : null,
  //       path: `${builder.path}-${Math.random().toString(36).substring(2, 8)}`,
  //       builderNfts: {
  //         createMany: {
  //           data: builderNfts.map(({builderId, ...builderNft}) => ({
  //             ...builderNft,
  //             tokenId: Number(builderTokenId),
  //             // Using scout token, so we multiply by 10 vs USDC. We then remove the 6 decimals as USDC has 6 decimals, and trying to store the number with 18 decimals will cause overflows
  //             currentPrice: (BigInt(builderNft.currentPrice) * BigInt(10) / BigInt(10e6))
  //           }))
  //         }
  //       },
  //       githubUsers: {
  //         createMany: {
  //           data: githubUsers.map(({builderId, ...githubUser}) => ({
  //             ...githubUser
  //           }))
  //         }
  //       }
  //     }
  //   })
  // };

  const existingScoutsByWallet = await prisma.scout.findMany({
    where: {
      wallets: {
        some: {
          address: {
            in: scouts.map(({wallets}) => wallets[0].address)
          }
        }
      }
    },
    include: {
      wallets: true
    }
  });

  const scoutsToCreate = scouts.filter(scout => !existingScoutsByWallet.find(existing => 
    existing.wallets.some(wallet => wallet.address === scout.wallets[0].address)
  ));

  log.info(`Processing scouts`);

  if (scoutsToCreate.length > 0) {
    log.info(`Creating ${scoutsToCreate.length} scouts`);
    for (const scout of scoutsToCreate) {
      await prisma.scout.upsert({
        where: {
          id: scout.id
        },
        update: {
          wallets: {
            createMany: {
              data: scout.wallets.map(wallet => ({
                address: wallet.address
              }))
            }
          }
        },
        create: {
          ...scout,
          path: `${scout.path}-${Math.random().toString(36).substring(2, 8)}`,
          referralCode: uuid(),
          wallets: {
            create: scout.wallets.map(wallet => ({
              address: wallet.address
            }))
          }
        }
      });
    }
  }



  const existingRepos = await prisma.githubRepo.findMany({
    where: {
      id: {
        in: repos.map(({id}) => id)
      }
    }
  });
  const reposToCreate = repos.filter(repo => !existingRepos.find(existing => existing.id === repo.id));

  log.info(`Processing repos`);

  if (reposToCreate.length > 0) {
    log.info(`Creating ${reposToCreate.length} repos`);
    await prisma.githubRepo.createMany({
      data: reposToCreate
    });
  }

  const existingGithubUsers = await prisma.githubUser.findMany({
    select: {
      id: true
    }
  });

  log.info(`Processing github events. Found ${existingGithubUsers.length} existing github users`);

  const existingGithubEvents = await prisma.githubEvent.findMany({
    where: {
      id: {
        in: githubEvents.map(({id}) => id)
      }
    },
    select: {
      id: true
    }
  });

  const githubEventsToCreate = githubEvents.filter(event => !existingGithubEvents.find(existing => existing.id === event.id) && 
  // Make sure the createdBy user exists
  existingGithubUsers.find(existing => existing.id === event.createdBy));

  const githubEventsToCreateWithStrikes = githubEventsToCreate.filter(event => event.strike);

  log.info(`Processing github events`);
  if (githubEventsToCreate.length > 0) {
    log.info(`Creating ${githubEventsToCreate.length} github events`);
    await prisma.githubEvent.createMany({
      data: githubEventsToCreate.map(({strike, ...event}) => ({
        ...event
      }))
    });

    log.info(`Creating ${githubEventsToCreateWithStrikes.length} builder strikes`);
    await prisma.builderStrike.createMany({
      data: githubEventsToCreateWithStrikes.map(({strike}) => ({
        ...strike as Prisma.BuilderStrikeCreateManyInput
      }))
    });
  }

  const existingBuilderEvents = await prisma.builderEvent.findMany({
    where: {
      id: {
        in: builderEvents.map(({id}) => id)
      }
    }
  });

  // @ts-ignore
  const validGithubEvents = [...existingGithubEvents, ...githubEventsToCreate] as {id: string}[];

  const builderEventsToCreate = builderEvents.filter(event => !existingBuilderEvents.find(existing => existing.id === event.id) && (!event.githubEventId ? true : validGithubEvents.some(githubEvent => githubEvent.id === event.githubEventId)));

  log.info(`Processing builder events`);
  if (builderEventsToCreate.length > 0) {
    log.info(`Creating ${builderEventsToCreate.length} builder events`);
    await prisma.builderEvent.createMany({
      data: builderEventsToCreate.map(({gemsReceipt, ...event}) => ({
        ...event
      }))
    });

    await prisma.gemsReceipt.createMany({
      data: builderEventsToCreate.map(({gemsReceipt}) => ({
        ...gemsReceipt
      }))
    });
  }
}

uploadBuildersScoutsAndRepos().then(console.log);