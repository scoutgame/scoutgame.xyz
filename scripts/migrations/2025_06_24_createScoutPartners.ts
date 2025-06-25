import { prisma, ScoutPartner } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { formatUnits } from 'viem';

const scoutPartnersConfig: ScoutPartner[] = [{
  id: 'octant',
  name: 'Base + Octant',
  icon: '/images/logos/octant.png',
  bannerImage: '/images/info/rewards-partner-octant-base.png',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'game7',
  name: 'Game7',
  icon: '/images/crypto/game7.png',
  bannerImage: '/images/promos/game7-promo-slide.png',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'op_supersim',
  name: 'Optimism Supersim',
  icon: '/images/crypto/op.png',
  bannerImage: '/images/promos/op-supersim-promo-slide.png',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'lit-protocol',
  name: 'Lit Protocol',
  icon: '/images/logos/lit-protocol.png',
  bannerImage: '/images/info/rewards-partner-lit.png',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'talent-protocol',
  name: 'Talent Protocol',
  icon: '/images/crypto/talent.jpg',
  bannerImage: '/images/promos/talent-promo-slide.png',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'bountycaster',
  name: 'BountyCaster',
  icon: '/images/logos/bountycaster.png',
  bannerImage: '/images/info/rewards-partner-bountycaster.jpg',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'divvi',
  name: 'Divvi',
  icon: '/images/crypto/divvi.png',
  bannerImage: '/images/promos/divvi-promo-slide.png',
  status: 'active',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'taiko',
  name: 'Taiko',
  icon: '/images/crypto/taiko.png',
  bannerImage: '/images/promos/taiko-promo-slide.png',
  status: 'completed',
  tokenAmountPerPullRequest: null,
  tokenAddress: null,
  tokenChain: null,
}, {
  id: 'celo',
  name: 'Celo',
  icon: '/images/crypto/celo.png',
  bannerImage: '/images/promos/celo-promo-slide.png',
  status: 'active',
  tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
  tokenChain: 42220,
  tokenAmountPerPullRequest: 50,
}, {
  id: 'good-dollar',
  name: 'GoodDollar',
  icon: '/images/logos/good-dollar.png',
  bannerImage: '/images/info/rewards-partner-good-dollar.png',
  status: 'active',
  tokenAddress: '0x67C5870b4A41D4Ebef24d2456547A03F1f3e094B',
  tokenChain: 42220,
  tokenAmountPerPullRequest: 500000,
}]

async function createScoutPartners() {
  for (const partner of scoutPartnersConfig) {
    await prisma.scoutPartner.upsert({
      where: { id: partner.id },
      update: partner,
      create: {
        id: partner.id,
        name: partner.name,
        icon: partner.icon,
        bannerImage: partner.bannerImage,
        status: partner.status,
        tokenAmountPerPullRequest: partner.tokenAmountPerPullRequest,
        tokenAddress: partner.tokenAddress,
      }
    })
  }

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
}

createScoutPartners();
