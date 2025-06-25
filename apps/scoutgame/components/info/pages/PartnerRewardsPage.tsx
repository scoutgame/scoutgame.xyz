import type { ScoutPartnerStatus } from '@charmverse/core/prisma';
import { Stack, Typography } from '@mui/material';
import { getScoutPartnersInfo } from '@packages/scoutgame/scoutPartners/getScoutPartnersInfo';
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
  status: ScoutPartnerStatus;
  name: string;
  image: string;
  href?: string;
}) {
  const content = (
    <Stack flexDirection='row' gap={2} alignItems='center'>
      <Image src={image} alt={name} width={32} height={32} style={{ borderRadius: '50%' }} />
      <Stack>
        <Typography color={status === 'active' ? 'primary' : 'text.primary'} variant='h6' fontWeight={400}>
          {name}
        </Typography>
        {status !== 'active' && (
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

async function Document() {
  const scoutPartnersInfo = await getScoutPartnersInfo({ allStatus: true });

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
            {scoutPartnersInfo.map((partner) => (
              <PartnerReward
                key={partner.href}
                name={partner.text}
                image={partner.image}
                href={partner.href}
                status={partner.status}
              />
            ))}
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
