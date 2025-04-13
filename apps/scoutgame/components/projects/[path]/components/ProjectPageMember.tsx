'use client';

import type { ScoutProjectMemberRole, OnchainAchievementTier } from '@charmverse/core/prisma';
import { Avatar, Stack, Typography } from '@mui/material';
import type { ProjectTeamMember } from '@packages/scoutgame/projects/getProjectByPath';
import { GemsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import Link from 'next/link';

import { useGlobalModal } from 'components/common/ModalProvider';

import { ProjectRoleText } from '../../constants';

export function ProjectPageMember({
  member,
  projectTier
}: {
  member: ProjectTeamMember;
  projectTier?: OnchainAchievementTier;
}) {
  const { openModal } = useGlobalModal();

  return (
    <Stack
      component={Link}
      href={`/u/${member.path}`}
      onClick={(e) => {
        e.preventDefault();
        openModal('draftDeveloper', { path: member.path });
      }}
      key={member.id}
      flexDirection='row'
      alignItems='center'
      gap={2}
      bgcolor='background.paper'
      pl={1.5}
      py={1}
      borderRadius={1}
      sx={{ cursor: 'pointer' }}
    >
      <Avatar src={member.avatar} alt={member.displayName} />
      <Typography>{member.displayName}</Typography>
      <Typography variant='caption' color='secondary'>
        {ProjectRoleText[member.role as ScoutProjectMemberRole]}
      </Typography>
      {member.gemsThisWeek > 0 && (
        <Typography
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1, justifyContent: 'flex-end', mr: 3 }}
        >
          +{member.gemsThisWeek}
          <GemsIcon color={projectTier} size={16} />
        </Typography>
      )}
    </Stack>
  );
}
