import styled from '@emotion/styled';
import { Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import Link from 'components/common/Link';
import { DiscordSocialIcon } from 'components/profile/components/UserDetails/DiscordSocialIcon';
import type { Social } from 'components/profile/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import type { Member } from 'lib/members/interfaces';

import { TimezoneDisplay } from './TimezoneDisplay';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
`;

export function MemberDirectoryTableView ({
  members
}: {
  members: Member[];
}) {
  const { properties = [] } = useMemberProperties();
  const [currentSpace] = useCurrentSpace();

  return (
    <Table
      size='small'
      sx={{
        my: 2,
        '& .MuiTableCell-root': {
          whiteSpace: 'nowrap',
          maxWidth: 150,
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }
      }}
    >
      <TableHead>
        <TableRow>
          {properties.map(property => <StyledTableCell key={property.id}>{property.name}</StyledTableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map(member => {
          const twitterUrl = (member.profile?.social as Social)?.twitterURL ?? '';
          const twitterHandle = twitterUrl.split('/').at(-1);
          const discordUsername = (member.profile?.social as Social)?.discordUsername;
          return (
            <TableRow
              key={member.id}
            >
              {properties.map(property => {
                const memberProperty = member.properties.find(_property => _property.memberPropertyId === property.id);
                if (memberProperty) {
                  switch (property.type) {
                    case 'profile_pic': {
                      return (
                        <TableCell sx={{
                          p: 1
                        }}
                        >
                          <Avatar avatar={member.avatar} name={member.username} variant='circular' size='large' />
                        </TableCell>
                      );
                    }
                    case 'role': {
                      return (
                        <TableCell>
                          <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                            {member.roles.length === 0 ? 'N/A' : member.roles.map(role => <Chip label={role.name} key={role.id} size='small' variant='outlined' />)}
                          </Stack>
                        </TableCell>
                      );
                    }
                    case 'discord': {
                      return (
                        <TableCell>
                          {discordUsername ? <DiscordSocialIcon showLogo={false} showUsername username={discordUsername} /> : 'N/A'}
                        </TableCell>
                      );
                    }
                    case 'twitter': {
                      return (
                        <TableCell>
                          {twitterHandle ? <Link target='_blank' href={`https://twitter.com/${twitterHandle}`}>@{twitterHandle}</Link> : 'N/A'}
                        </TableCell>
                      );
                    }
                    case 'timezone': {
                      return (
                        <TableCell>
                          <Box sx={{
                            gap: 1,
                            display: 'flex',
                            flexDirection: 'row'
                          }}
                          >
                            <TimezoneDisplay
                              showTimezone
                              timezone={member.profile?.timezone}
                            />
                          </Box>
                        </TableCell>
                      );
                    }
                    case 'name': {
                      return (
                        <TableCell>
                          <Link color='inherit' href={`/u/${member.path || member.id}${currentSpace ? `?workspace=${currentSpace.id}` : ''}`}>
                            <Typography fontWeight='bold'>
                              {memberProperty.value ?? member.username}
                            </Typography>
                          </Link>
                        </TableCell>
                      );
                    }
                    case 'text':
                    case 'phone':
                    case 'email':
                    case 'url':
                    case 'number': {
                      return (
                        <TableCell key={property.id}>
                          <Typography variant='body2'>{memberProperty.value ?? 'N/A'}</Typography>
                        </TableCell>
                      );
                    }

                    case 'select':
                    case 'multiselect': {
                      return (
                        <TableCell key={property.id}>
                          {memberProperty.value
                            ? (
                              <SelectPreview
                                size='small'
                                options={property.options as SelectOptionType[]}
                                value={memberProperty.value as (string | string[])}
                              />
                            )
                            : null}
                        </TableCell>
                      );
                    }
                    default: {
                      return (
                        <TableCell key={property.id}>
                          <Typography variant='body2'>{memberProperty.value ?? 'N/A'}</Typography>
                        </TableCell>
                      );
                    }
                  }
                }
                return null;
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
