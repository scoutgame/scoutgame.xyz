import { Button, SvgIcon, CircularProgress, Alert } from '@mui/material';
import { Box } from '@mui/system';
import DiscordServersModal from 'components/common/DiscordServersModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useDiscordServers from 'hooks/useDiscordServers';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import DiscordIcon from 'public/images/discord_logo.svg';

export default function ImportDiscordRoles () {
  const [isDiscordServersModalOpen, setIsDiscordServersModalOpen] = useState(false);
  const {
    discordServers,
    isListingDiscordServers,
    discordError,
    importRolesFromServer,
    isListDiscordServersLoading,
    isImportRolesFromServerLoading,
    importRolesFromServerError
  } = useDiscordServers();
  const [user] = useUser();
  const [space] = useCurrentSpace();

  useEffect(() => {
    // If we've fetched list of servers
    // If we are listing discord servers
    // If there were no errors while fetching list of servers
    // Show the discord servers modal
    if (!isListDiscordServersLoading && isListingDiscordServers && !discordError) {
      setIsDiscordServersModalOpen(true);
    }
    else {
      setIsDiscordServersModalOpen(false);
    }
  }, [isListDiscordServersLoading, discordError, isListingDiscordServers]);

  const isCurrentUserAdmin = (user?.spaceRoles
    .find(spaceRole => spaceRole.spaceId === space?.id)?.role === 'admin');

  return (
    <>
      <Box
        display='flex'
        gap={1}
        alignItems='center'
      >
        <Button
          disabled={(isListDiscordServersLoading && isListingDiscordServers) || !isCurrentUserAdmin}
          onClick={() => {
            if (isCurrentUserAdmin) {
              window.location.replace(`/api/discord/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=server`);
            }
          }}
          variant='outlined'
          startIcon={(
            <SvgIcon viewBox='0 -10 70 70' sx={{ color: 'text.primary' }}>
              <DiscordIcon />
            </SvgIcon>
        )}
          endIcon={(
          isListDiscordServersLoading && <CircularProgress size={20} />
        )}
        >
          Import Roles
        </Button>
      </Box>
      <DiscordServersModal
        isListDiscordServersLoading={isListDiscordServersLoading}
        isOpen={isDiscordServersModalOpen}
        discordServers={discordServers}
        isImportRolesFromServerLoading={isImportRolesFromServerLoading}
        onClose={() => {
          setIsDiscordServersModalOpen(false);
        }}
        onImportingDiscordRoles={(guildId) => importRolesFromServer(guildId)}
      />
      {importRolesFromServerError && (typeof importRolesFromServerError !== 'string' ? importRolesFromServerError?.length !== 0 && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          <Box sx={{
            display: 'flex', gap: 2, flexDirection: 'column'
          }}
          >
            Error faced during importing roles
            {importRolesFromServerError?.map(failedImport => (
              <div>
                <Box sx={{
                  display: 'flex',
                  gap: 1
                }}
                >
                  <span>{failedImport.action === 'assign' ? `Failed to assign ${failedImport.roles.join(',')} to user ${failedImport.username}` : `Failed to create role ${failedImport.role}`}</span>
                </Box>
              </div>
            ))}
          </Box>
        </Alert>
      ) : (
        <Alert severity='error' sx={{ mt: 2 }}>
          {discordError}
        </Alert>
      ))}
    </>
  );
}
