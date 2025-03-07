'use client';

import EditIcon from '@mui/icons-material/Edit';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getProjectByPath';
import Link from 'next/link';

import { useUser } from '../../../../providers/UserProvider';

export function EditProjectIcon({
  path,
  teamMembers
}: {
  path: string;
  teamMembers: ScoutProjectDetailed['teamMembers'];
}) {
  const { user } = useUser();
  const teamMember = teamMembers.find((member) => member.id === user?.id && member.role === 'owner');
  if (!teamMember) return null;
  return (
    <Link href={`/profile/projects/${path}/edit`}>
      <EditIcon color='primary' />
    </Link>
  );
}
