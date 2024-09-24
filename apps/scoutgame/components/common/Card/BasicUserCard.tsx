'use client';

import { Box, Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { BasicUserInfo } from 'lib/builders/interfaces';

export function BasicUserCard({
  user,
  children,
  childrenInside
}: {
  children: ReactNode;
  childrenInside: ReactNode;
  user: BasicUserInfo;
}) {
  return (
    <Card sx={{ border: 'none' }}>
      <Box borderRadius='5px' overflow='hidden'>
        <CardActionArea
          LinkComponent={Link}
          href={`/u/${user.username}`}
          sx={{
            bgcolor: 'black.dark',
            borderStyle: 'solid',
            borderWidth: '4px',
            borderImage: 'linear-gradient(152.64deg, #69DDFF 2.2%, #85A5EA 48.95%, #A06CD5 95.71%) 1'
          }}
        >
          <Box position='relative'>
            <CardMedia component='img' sx={{ aspectRatio: '1 / 1' }} image={user.avatar ?? ''} />
            <CardMedia
              component='img'
              width='30px'
              height='30px'
              image='/images/profile/icons/blue-fire-icon.svg'
              alt='hot icon'
              sx={{ position: 'absolute', top: 10, right: 10, width: 'initial' }}
            />
            <CardMedia
              component='img'
              width='40px'
              height='40px'
              image='/images/profile/icons/season1-icon.svg'
              alt='hot icon'
              sx={{ position: 'absolute', top: 5, left: 5, width: 'initial' }}
            />
          </Box>
          <CardContent sx={{ p: 1 }}>
            <Typography gutterBottom variant='body1' textAlign='center' noWrap>
              {user.username}
            </Typography>
            {childrenInside}
          </CardContent>
        </CardActionArea>
      </Box>
      <Box>{children}</Box>
    </Card>
  );
}
