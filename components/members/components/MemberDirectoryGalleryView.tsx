import EditIcon from '@mui/icons-material/Edit';
import { Card, Chip, Grid, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import Link from 'components/common/Link';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { SocialIcons } from 'components/profile/components/UserDetails/SocialIcons';
import type { Social } from 'components/profile/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';

import { TimezoneDisplay } from './TimezoneDisplay';

function MemberDirectoryGalleryCard ({
  member
}: {
  member: Member;
}) {
  const { properties = [] } = useMemberProperties();
  const nameProperty = properties.find(property => property.type === 'name');
  const [currentSpace] = useCurrentSpace();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { updateSpaceValues } = useMemberPropertyValues(member.id);
  const admin = isAdmin();
  const { mutateMembers } = useMembers();

  return (
    <>
      <Link
        href={`/u/${member.path || member.id}${currentSpace ? `?workspace=${currentSpace.id}` : ''}`}
        sx={{
          '&:hover': {
            opacity: 0.8
          },
          position: 'relative'
        }}
      >
        <Card sx={{ width: '100%' }}>
          {((user?.id === member.id && currentSpace) || admin) && (
            <IconButton
              size='small'
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
          )}
          <Avatar
            sx={{
              width: '100%'
            }}
            avatar={member.avatar}
            name={member.username}
            size='2xLarge'
            variant='square'
          />
          <Stack p={2} gap={1}>
            <Typography gutterBottom variant='h6' mb={0} component='div'>
              {member.properties.find(memberProperty => memberProperty.memberPropertyId === nameProperty?.id)?.value ?? member.username}
            </Typography>
            <SocialIcons gap={1} social={member.profile?.social as Social} />
            <Stack gap={0.5}>
              <Typography fontWeight='bold' variant='subtitle2'>Roles</Typography>
              <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                {member.roles.length === 0 ? 'N/A' : member.roles.map(role => <Chip label={role.name} key={role.id} size='small' variant='outlined' />)}
              </Stack>
            </Stack>
            <Stack flexDirection='row' gap={1}>
              <TimezoneDisplay
                showTimezone
                timezone={member.profile?.timezone}
              />
            </Stack>
            {properties.map(property => {
              const memberPropertyValue = member.properties.find(memberProperty => memberProperty.memberPropertyId === property.id);
              switch (property.type) {
                case 'text':
                case 'text_multiline':
                case 'phone':
                case 'email':
                case 'url':
                case 'number': {
                  return (
                    <Stack key={property.id}>
                      <Typography fontWeight='bold' variant='subtitle2'>{property.name}</Typography>
                      <Typography variant='body2'>{memberPropertyValue?.value ?? 'N/A'}</Typography>
                    </Stack>
                  );
                }
                case 'select':
                case 'multiselect': {
                  return memberPropertyValue
                    ? (
                      <SelectPreview
                        size='small'
                        options={property.options as SelectOptionType[]}
                        value={memberPropertyValue.value as (string | string[])}
                        name={property.name}
                      />
                    )
                    : null;
                }

                default: {
                  return null;
                }
              }
            })}
          </Stack>
        </Card>
      </Link>
      {isModalOpen && user && currentSpace && (
        <MemberPropertiesPopupForm
          onClose={() => {
            setIsModalOpen(false);
            mutateMembers();
          }}
          memberId={member.id}
          spaceId={currentSpace.id}
          updateMemberPropertyValues={updateSpaceValues}
        />
      )}
    </>
  );
}

export function MemberDirectoryGalleryView ({
  members
}: {
  members: Member[];
}) {
  return (
    <Grid container gap={2.5}>
      {members.map(member => (
        <Grid item xs={12} sm={5} md={3.75} key={member.id}>
          <MemberDirectoryGalleryCard member={member} />
        </Grid>
      ))}
    </Grid>
  );
}
