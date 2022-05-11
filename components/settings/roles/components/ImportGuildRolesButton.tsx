import { useEffect, useMemo, useState } from 'react';
import { Modal } from 'components/common/Modal';
import { GetGuildsResponse, guild } from '@guildxyz/sdk';
import { Avatar, Box, Checkbox, List, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import Link from 'components/common/Link';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { mutate } from 'swr';
import { PimpedButton, StyledSpinner } from '../../../common/Button';

export default function ImportGuildRolesButton () {
  const [showImportedRolesModal, setShowImportedRolesModal] = useState(false);
  const [guilds, setGuilds] = useState<GetGuildsResponse>([]);
  const [fetchingGuilds, setFetchingGuilds] = useState(false);
  const [importingRoles, setImportingRoles] = useState(false);
  const [selectedGuildIds, setSelectedGuildIds] = useState<number[]>([]);
  const [space] = useCurrentSpace();
  const selectedGuildIdsSet = useMemo(() => new Set(selectedGuildIds), [selectedGuildIds]);

  useEffect(() => {
    async function main () {
      if (showImportedRolesModal) {
        setFetchingGuilds(true);
        // if (currentUser && currentUser?.addresses?.[0]) {
        // }
        const allGuilds = await guild.getAll();
        // Use react-virtualized as this fetches a lot of items
        setGuilds(allGuilds.slice(0, 50));
        setFetchingGuilds(false);
      }
    }
    main();
  }, [showImportedRolesModal]);

  const isAllGuildSelected = selectedGuildIds.length === guilds.length;

  function resetState () {
    setShowImportedRolesModal(false);
    setImportingRoles(false);
    setFetchingGuilds(false);
    setSelectedGuildIds([]);
    setGuilds([]);
  }

  async function importRoles () {
    if (space) {
      setImportingRoles(true);
      await charmClient.importRolesFromGuild({
        guildIds: selectedGuildIds,
        spaceId: space.id
      });
      setImportingRoles(false);
      setSelectedGuildIds([]);
      mutate(`roles/${space.id}`);
    }
  }

  return (
    <>
      <div onClick={() => setShowImportedRolesModal(true)}>Import Roles</div>
      <Modal size='large' title='Import Guild roles' onClose={resetState} open={showImportedRolesModal}>
        {fetchingGuilds ? <StyledSpinner />
          : (
            <div>
              <Box display='flex' justifyContent='space-between'>
                <Box display='flex' alignItems='center'>
                  <Checkbox
                    disabled={importingRoles}
                    checked={isAllGuildSelected}
                    onClick={() => {
                      if (isAllGuildSelected) {
                        setSelectedGuildIds([]);
                      }
                      else {
                        setSelectedGuildIds(guilds.map(_guild => _guild.id));
                      }
                    }}
                  />
                  <Typography sx={{
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                  }}
                  >Select All
                  </Typography>
                </Box>
                <Typography color='secondary' variant='subtitle1'>{selectedGuildIds.length} / {guilds.length}</Typography>
              </Box>
              <Box sx={{
                maxHeight: 325,
                overflow: 'auto',
                paddingRight: 1
              }}
              >
                {guilds.map(_guild => (
                  <List
                    key={_guild.id}
                    sx={{
                      display: 'flex'
                    }}
                  >
                    <Checkbox
                      checked={selectedGuildIdsSet.has(_guild.id)}
                      onClick={(event) => {
                        if ((event.target as any).checked) {
                          setSelectedGuildIds([...selectedGuildIds, _guild.id]);
                        }
                        else {
                          setSelectedGuildIds(selectedGuildIds.filter(selectedGuildId => selectedGuildId !== _guild.id));
                        }
                      }}
                    />
                    <Box sx={{
                      width: '100%'
                    }}
                    >
                      <Link external target='_blank' href={`https://guild.xyz/${_guild.urlName}`}>
                        <MenuItem
                          disabled={importingRoles}
                        >
                          <ListItemIcon sx={{ mr: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }} src={_guild.imageUrl} />
                          </ListItemIcon>
                          <ListItemText
                            secondary={_guild.urlName}
                            sx={{
                              '& .MuiTypography-root': {
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexDirection: 'row'
                              }
                            }}
                          >
                            {_guild.name}
                            <Box display='flex' gap={1}>
                              <Typography variant='subtitle2' color='secondary'>
                                {_guild.memberCount} Member(s)
                              </Typography>
                              <Typography variant='subtitle2' color='secondary'>
                                {_guild.roles.length} Role(s)
                              </Typography>
                            </Box>
                          </ListItemText>
                        </MenuItem>
                      </Link>
                    </Box>
                  </List>
                ))}
              </Box>
              <PimpedButton
                loading={importingRoles}
                sx={{
                  mt: 2
                }}
                disabled={importingRoles}
                onClick={importRoles}
              >Import Roles
              </PimpedButton>
            </div>
          )}
      </Modal>
    </>
  );
}
