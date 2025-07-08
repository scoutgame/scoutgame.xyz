import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function createScoutPartners() {
  const scoutPartners = await prisma.scoutPartner.findMany({
    select: {
      id: true
    }
  })

  const [builderEvents, githubRepos] = await Promise.all([
    prisma.builderEvent.findMany({
      where: {
        bonusPartner: {
          not: null
        },
        season: getCurrentSeasonStart()
      }
    }),
    prisma.githubRepo.findMany({
      where: {
        bonusPartner: {
          not: null
        }
      }
    })
  ])

  for (const builderEvent of builderEvents) {
    const scoutPartner = scoutPartners.find((partner) => partner.id === builderEvent.bonusPartner);
    if (scoutPartner) {
      await prisma.builderEvent.update({
        where: { id: builderEvent.id },
        data: { scoutPartnerId: scoutPartner.id }
      })
    } 
  }

  for (const githubRepo of githubRepos) {
    const scoutPartner = scoutPartners.find((partner) => partner.id === githubRepo.bonusPartner);
    if (scoutPartner) {
      await prisma.githubRepo.update({
        where: { id: githubRepo.id },
        data: { scoutPartnerId: scoutPartner.id }
      })
    }
  }

  await Promise.all([prisma.partnerRewardPayoutContract.updateMany({
    where: {
      partner: 'base_octant_contribution'
    },
    data: {
      partner: 'octant'
    }
  }), prisma.partnerRewardPayoutContract.updateMany({
    where: {
      partner: 'gooddollar_contribution'
    },
    data: {
      partner: 'gooddollar'
    }
  })])
}

createScoutPartners();
