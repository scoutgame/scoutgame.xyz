'use client';

import type { ScoutPartner } from '@charmverse/core/prisma';
import { Box } from '@mui/material';
import { Carousel } from '@packages/scoutgame-ui/components/common/Carousel/Carousel';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';
import Link from 'next/link';

export function PartnerRewardsCarousel({ scoutPartners }: { scoutPartners: ScoutPartner[] }) {
  const isDesktop = useMdScreen();

  return (
    <Box
      mb={0}
      sx={{
        '& img.swiper-pagination-bullet': {
          width: {
            xs: 17.5,
            md: 25
          },
          height: {
            xs: 17.5,
            md: 25
          },
          borderRadius: '50%',
          '&.skip-rounded-border': {
            borderRadius: 0
          },
          marginRight: {
            xs: '10px !important',
            md: '20px !important'
          },
          marginLeft: {
            xs: '10px !important',
            md: '20px !important'
          },
          zIndex: 100,
          position: 'relative',
          top: 10,
          opacity: 0.5
        },
        '& img.swiper-pagination-bullet-active': {
          opacity: 1
        },
        '& .swiper-pagination': {
          position: 'relative',
          bottom: 5
        },
        '& .swiper-pagination-bullet-active': {
          backgroundColor: 'transparent'
        }
      }}
    >
      <Carousel
        height={isDesktop ? 300 : 145}
        slidesPerView={1}
        autoplay
        pagination={{
          clickable: true,
          renderBullet: (index, className) =>
            `<img src="${scoutPartners[index].icon}" style="border-radius: 50%" class="${className} skip-rounded-border"/>`
        }}
        slotProps={{ boxProps: { width: { xs: '100%', md: '95%' } } }}
      >
        {scoutPartners.map((partner) => (
          <Link href={`/info/partner-rewards/${partner.id}`} key={partner.name}>
            <Image
              src={partner.bannerImage}
              alt={partner.name}
              width={isDesktop ? 750 : 250}
              height={isDesktop ? 250 : 115}
              style={{ objectFit: 'contain', width: '100%' }}
            />
          </Link>
        ))}
      </Carousel>
    </Box>
  );
}
