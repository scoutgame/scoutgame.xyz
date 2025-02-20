'use client';

import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

import { useDeveloperInfoModal } from '../../../../providers/DeveloperInfoModalProvider';
import { ProjectRoleText } from '../../constants';

export function ProjectPageMember({ member }: { member: ScoutProjectDetailed['teamMembers'][number] }) {
  const { openModal } = useDeveloperInfoModal();

  return (
    <Stack
      component={Link}
      href={`/u/${member.path}`}
      onClick={(e) => {
        e.preventDefault();
        openModal(member.path);
      }}
      key={member.id}
      flexDirection='row'
      alignItems='center'
      gap={1}
      bgcolor='background.paper'
      px={1.5}
      py={1}
      borderRadius={1}
      sx={{ cursor: 'pointer' }}
    >
      <Image src={member.avatar} alt={member.displayName} width={25} height={25} style={{ borderRadius: '50%' }} />
      <Typography>{member.displayName}</Typography>
      <Typography variant='caption' color='secondary'>
        {ProjectRoleText[member.role as ScoutProjectMemberRole]}
      </Typography>
    </Stack>
  );
}
