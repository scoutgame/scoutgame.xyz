import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { formatUnits } from 'viem';

const previousWeeklyClaims = [
  {
    amount: '571828592110353857357',
    address: '0x503a5161d1c5d9d82bf35a4c80da0c3ad72d9244',
    claimed: true
  },
  {
    amount: '554673734347043241636',
    address: '0x308112d06027cd838627b94ddfc16ea6b4d90004',
    claimed: false
  },
  {
    amount: '538033522316631944387',
    address: '0xed463302576436f499fae661d22e0c3cf880b8d3',
    claimed: true
  },
  {
    amount: '521888895066049620481',
    address: '0x3c1763006fcdea4b467cc8fe9c28fab664d0f6ed',
    claimed: false
  },
  {
    amount: '506220791642225924789',
    address: '0xf2bdf8483fc02874bbe20593bf47b9474172c3ec',
    claimed: true
  },
  {
    amount: '491048272998231202441',
    address: '0x08e1866061fe8f670998b854200ab62afe53ae67',
    claimed: true
  },
  {
    amount: '476314156274854418050',
    address: '0x475eaa9b5386f2fd85d821cf72eec45fe7e4c09a',
    claimed: false
  },
  {
    amount: '285914296055176928678',
    address: '0x7c0d681098a9d46bd34637870c3afa4bfc9ec720',
    claimed: false
  },
  {
    amount: '277336867173521620818',
    address: '0xb8c198e8f563096c9df0067e7e64a4da8c129d5a',
    claimed: true
  },
  {
    amount: '1224304076661337953728',
    address: '0x1e22968fcd63bf083f067c8619c441a1b8e8f1bf',
    claimed: true
  },
  {
    amount: '3037057896510370716938',
    address: '0xbba4c7e447c292666a0fe581cf792260be7e162d',
    claimed: true
  }
];

async function fixUserStats(userAddress: string) {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      wallets: {
        some: {
          address: userAddress.toLowerCase()
        }
      }
    },
    select: {
      id: true
    }
  });

  const userId = user.id;

  const tokenReceipts = await prisma.tokensReceipt.findMany({
    where: {
      recipientWalletAddress: userAddress,
      event: {
        season: getCurrentSeasonStart()
      }
    },
    select: {
      value: true,
      event: {
        select: {
          type: true,
          builderId: true
        }
      },
      recipientWallet: {
        select: {
          scoutId: true
        }
      }
    }
  });

  let pointsEarnedAsDeveloper = BigInt(0);
  let pointsEarnedAsScout = BigInt(0);

  for (const receipt of tokenReceipts) {
    if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId === receipt.recipientWallet?.scoutId) {
        pointsEarnedAsDeveloper += BigInt(receipt.value);
      } else {
        pointsEarnedAsScout += BigInt(receipt.value);
      }
    }
  }

  const pointsEarnedAsDeveloperNumber = Number(formatUnits(pointsEarnedAsDeveloper, 18));
  const pointsEarnedAsScoutNumber = Number(formatUnits(pointsEarnedAsScout, 18));

  await prisma.userSeasonStats.update({
    where: {
      userId_season: {
        userId,
        season: getCurrentSeasonStart()
      }
    },
    data: {
      pointsEarnedAsBuilder: pointsEarnedAsDeveloperNumber,
      pointsEarnedAsScout: pointsEarnedAsScoutNumber
    }
  });

  await prisma.userAllTimeStats.update({
    where: {
      userId
    },
    data: {
      pointsEarnedAsBuilder: pointsEarnedAsDeveloperNumber,
      pointsEarnedAsScout: pointsEarnedAsScoutNumber
    }
  });
}

async function fixWeeklyClaims() {
  const weeklyClaim = await prisma.weeklyClaims.findFirstOrThrow({
    where: {
      week: '2025-W23'
    },
    select: {
      claims: true
    }
  });

  const weeklyClaims = (weeklyClaim.claims as { leaves: { amount: string; address: string }[] }).leaves;
  const finalReceipts: { amount: string; address: string }[] = [];

  for (const weeklyClaim of weeklyClaims) {
    const previousClaim = previousWeeklyClaims.find(
      (c) => c.address.toLowerCase() === weeklyClaim.address.toLowerCase()
    );

    if (previousClaim) {
      const difference = BigInt(weeklyClaim.amount) - BigInt(previousClaim.amount);

      if (previousClaim.claimed && difference > 0) {
        finalReceipts.push({
          amount: formatUnits(difference, 18),
          address: weeklyClaim.address
        });

        const receipts = await prisma.tokensReceipt.updateMany({
          where: {
            recipientWalletAddress: weeklyClaim.address,
            event: {
              week: '2025-W23',
              type: 'gems_payout'
            }
          },
          data: {
            claimedAt: new Date(),
            value: difference.toString()
          }
        });

        if (receipts.count > 1) {
          console.error(`WARNING: Updated ${receipts.count} receipts for wallet ${weeklyClaim.address}`);
        }

        await fixUserStats(weeklyClaim.address);
      }
      //  else if (!previousClaim.claimed) {
      //   finalReceipts.push({
      //     amount: Number(formatUnits(BigInt(weeklyClaim.amount), 18)).toString(),
      //     address: weeklyClaim.address
      //   });
      // }
    }
  }

  console.log(JSON.stringify(finalReceipts, null, 2));
}

fixWeeklyClaims();
