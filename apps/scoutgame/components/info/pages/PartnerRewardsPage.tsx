import { Stack, Typography } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import Image from 'next/image';
import Link from 'next/link';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function PartnerRewardsPage() {
  return (
    <InfoPageContainer
      data-test='partner-rewards-page'
      image='/images/info/info_banner.png'
      title='Scout Game Partners'
    >
      <Document />
    </InfoPageContainer>
  );
}

function PartnerReward({
  name,
  image,
  href,
  status
}: {
  status?: 'paused' | 'completed';
  name: string;
  image: string;
  href?: string;
}) {
  const content = (
    <Stack flexDirection='row' gap={2} alignItems='center'>
      <Image src={image} alt={name} width={32} height={32} style={{ borderRadius: '50%' }} />
      <Stack>
        <Typography color={href ? 'primary' : 'text.primary'} variant='h6' fontWeight={400}>
          {name}
        </Typography>
        {status && (
          <Typography textTransform='uppercase' variant='caption'>
            {status}
          </Typography>
        )}
      </Stack>
    </Stack>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function Document() {
  return (
    <InfoCard title='Scout Game Partners'>
      <Typography>
        Scout Game is partnering with the hottest ecosystems to offer additional rewards to our devoted players, both
        Scouts and Developers. You can find details about active partnerships here. Check back often for new
        opportunities!
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 4, md: 2 }}>
        <Stack flex={1} gap={2}>
          <Typography variant='h6' fontWeight={600} color='secondary'>
            Developer Rewards
          </Typography>
          <Stack gap={{ xs: 2, md: 3 }}>
            <PartnerReward name='Base' image='/images/crypto/base.svg' href='/info/partner-rewards/octant' />
            <PartnerReward name='Octant' image='/images/crypto/octant.svg' href='/info/partner-rewards/octant' />
            <PartnerReward name='Taiko' image='/images/crypto/taiko.png' href='/info/partner-rewards/taiko' />
            <PartnerReward name='Celo' image='/images/crypto/celo.png' href='/info/partner-rewards/celo' />
            <PartnerReward
              name='GoodDollar'
              image='/images/logos/good-dollar.png'
              href='/info/partner-rewards/good-dollar'
            />
            <PartnerReward name='Game7' image='/images/crypto/game7.png' status='completed' />
            <PartnerReward name='Optimism Supersim' image='/images/crypto/op.png' status='completed' />
            <PartnerReward name='Lit Protocol' image='/images/crypto/lit.png' status='completed' />
            <PartnerReward name='Talent Protocol' image='/images/crypto/talent.jpg' status='completed' />
            <PartnerReward name='BountyCaster' image='/images/logos/bountycaster.png' status='completed' />
          </Stack>
        </Stack>
        <Stack flex={1} gap={2}>
          <Typography variant='h6' fontWeight={600} color='secondary'>
            Scout Rewards
          </Typography>
          <Stack gap={{ xs: 2, md: 3 }}>
            <PartnerReward name='Optimism' image='/images/crypto/op.png' status='completed' />
            <PartnerReward name='Moxie' image='/images/crypto/moxie.png' status='completed' />
            <PartnerReward name='Glo Dollar' image='/images/crypto/glo-dollar.png' status='completed' />
          </Stack>
        </Stack>
      </Stack>
    </InfoCard>
  );
}
