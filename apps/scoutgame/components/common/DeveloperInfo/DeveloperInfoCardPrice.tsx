import { BuilderNftType } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import type { DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';

import { ScoutButton } from '../ScoutButton/ScoutButton';

function DeveloperCardPricingSection({
  cardType,
  estimatedPayout,
  cardsSold,
  cardsSoldToScout,
  onClose,
  developerId,
  displayName,
  avatar,
  nftImageUrl,
  congratsImageUrl,
  cardPrice,
  path
}: {
  cardType: BuilderNftType;
  estimatedPayout: number;
  cardsSold: number;
  cardsSoldToScout: number;
  onClose: VoidFunction;
  developerId: string;
  displayName: string;
  avatar: string;
  nftImageUrl: string | null;
  congratsImageUrl: string | null;
  cardPrice: bigint;
  path: string;
}) {
  const isDesktop = useMdScreen();
  const color = cardType === BuilderNftType.starter_pack ? 'green.main' : 'secondary.main';
  const { user } = useUser();

  return (
    <Stack
      bgcolor='background.dark'
      p={{
        xs: 0.5,
        md: 1
      }}
      borderRadius={1}
      gap={0.5}
      flex={1}
    >
      <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='space-between'>
        <Typography color={color}>
          {cardType === BuilderNftType.starter_pack ? 'STARTER CARD' : 'REGULAR CARD'}
        </Typography>
        <Stack direction='row' gap={0.75} alignItems='center'>
          {user ? (
            <>
              <Typography color={color}>
                {cardsSoldToScout} of {cardsSold}
              </Typography>
              <Image
                src={
                  cardType === BuilderNftType.starter_pack
                    ? '/images/profile/icons/cards-green.svg'
                    : '/images/profile/icons/cards-secondary.svg'
                }
                width={17.5}
                height={17.5}
                alt='cards sold icon'
              />
              <Typography color={color}>Held</Typography>
            </>
          ) : (
            <>
              <Typography color={color}>{cardsSold}</Typography>
              <Image
                src={
                  cardType === BuilderNftType.starter_pack
                    ? '/images/profile/icons/cards-green.svg'
                    : '/images/profile/icons/cards-secondary.svg'
                }
                width={17.5}
                height={17.5}
                alt='cards sold icon'
              />
            </>
          )}
        </Stack>
      </Stack>
      <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='space-between'>
        <Stack>
          <Typography color={color}>Est. Payout</Typography>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <Typography variant={isDesktop ? 'h6' : 'body1'}>{estimatedPayout}</Typography>
            <Image
              src='/images/icons/binoculars.svg'
              width={isDesktop ? 24 : 18.5}
              height={isDesktop ? 15.5 : 12}
              alt='scoutgame icon'
            />
          </Stack>
        </Stack>
        <Stack gap={0.5} onClick={onClose}>
          <ScoutButton
            builder={{
              builderStatus: 'applied',
              id: developerId,
              displayName,
              path,
              price: cardPrice,
              nftImageUrl,
              avatar,
              congratsImageUrl
            }}
            type={cardType}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}

export function DeveloperInfoCardPrice({ developer, onClose }: { developer: DeveloperInfo; onClose: VoidFunction }) {
  return (
    <Stack
      direction={{
        xs: 'column',
        md: 'row'
      }}
      gap={0.5}
    >
      <DeveloperCardPricingSection
        developerId={developer.id}
        displayName={developer.displayName}
        avatar={developer.avatar}
        nftImageUrl={developer.starterCard.nftImageUrl}
        congratsImageUrl={developer.starterCard.congratsImageUrl}
        cardPrice={developer.starterCard.price}
        path={developer.path}
        cardType={BuilderNftType.starter_pack}
        estimatedPayout={developer.starterCard.estimatedPayout}
        cardsSold={developer.starterCard.cardsSold}
        cardsSoldToScout={developer.starterCard.cardsSoldToScout}
        onClose={onClose}
      />

      <DeveloperCardPricingSection
        developerId={developer.id}
        displayName={developer.displayName}
        avatar={developer.avatar}
        nftImageUrl={developer.regularCard.nftImageUrl}
        congratsImageUrl={developer.regularCard.congratsImageUrl}
        cardPrice={developer.regularCard.price}
        path={developer.path}
        cardType={BuilderNftType.default}
        estimatedPayout={developer.regularCard.estimatedPayout}
        cardsSold={developer.regularCard.cardsSold}
        cardsSoldToScout={developer.regularCard.cardsSoldToScout}
        onClose={onClose}
      />
    </Stack>
  );
}
