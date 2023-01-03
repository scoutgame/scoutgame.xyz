import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import { Box, MenuItem, ListItemIcon, ListItem, ListItemText, Tooltip, Typography, Link } from '@mui/material';
import Script from 'next/script';
import type { MouseEventHandler } from 'react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import useSwr from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import type { GoogleFormItem } from 'pages/api/google/forms';
import type { CredentialItem } from 'pages/api/google/forms/credentials';

import { googleIdentityServiceScript, useGoogleAuth } from './hooks/useGoogleAuth';

type Props = {
  onSelect: (source: Required<Pick<BoardViewFields, 'sourceData' | 'sourceType'>>) => void;
};

export function GoogleDataSource(props: Props) {
  const { data: credentials, mutate } = useSwr('google-credentials', () => charmClient.google.forms.getCredentials());
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);
  const { loginWithGoogle, onLoadScript } = useGoogleAuth({
    onConnect: () => {
      mutate();
    }
  });

  function selectCredential(credential: CredentialItem) {
    setSelectedCredential(credential);
  }
  if (!credentials) return <LoadingComponent />;
  if (credentials.length === 0) {
    return (
      <>
        <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
        <ConnectButton onClick={() => loginWithGoogle()} label='Connect Google Account' />
        <ListItem>
          <Typography variant='caption'>Find and embed your Google forms</Typography>
        </ListItem>
      </>
    );
  } else if (selectedCredential) {
    return (
      <GoogleFormSelect credential={selectedCredential} loginWithGoogle={loginWithGoogle} onSelect={props.onSelect} />
    );
  }
  return (
    <>
      <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
      {credentials.map((credential) => (
        <MenuItem divider dense key={credential.id} onClick={() => selectCredential(credential)}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Choose from&nbsp;
            <Tooltip title={credential.name}>
              <span> {credential.name}</span>
            </Tooltip>
          </span>
        </MenuItem>
      ))}
      <MenuItem dense sx={{ color: 'text.secondary' }} onClick={() => loginWithGoogle()} color='secondary'>
        Connect another account
      </MenuItem>
    </>
  );
}

function ConnectButton({
  label = 'Connect Google Account',
  onClick
}: {
  label?: string;
  onClick?: MouseEventHandler<HTMLLIElement>;
}) {
  return (
    <MenuItem onClick={onClick}>
      <ListItemIcon>
        <FcGoogle fontSize='large' />
      </ListItemIcon>
      <Typography color='primary' variant='body2' fontWeight='bold'>
        {label}
      </Typography>
    </MenuItem>
  );
}

function GoogleFormSelect({
  credential,
  loginWithGoogle,
  onSelect
}: {
  credential: CredentialItem;
  loginWithGoogle: (options: { hint?: string }) => void;
  onSelect: Props['onSelect'];
}) {
  const {
    data: forms,
    error,
    mutate
  } = useSwr(`google-credentials/${credential.id}`, () =>
    charmClient.google.forms.getForms({ credentialId: credential.id })
  );

  function selectForm(form: GoogleFormItem) {
    const sourceData: { credentialId: string; formId: string; formName: string; formUrl: string } = {
      credentialId: credential.id,
      formId: form.id,
      formName: form.name,
      formUrl: form.url
    };
    onSelect({ sourceData, sourceType: 'google_form' });
  }

  if (error) {
    if (error.status === 401) {
      return (
        <>
          <ConnectButton label='Reconnect Account' onClick={() => loginWithGoogle({ hint: credential.name })} />
          <ListItem>
            <Box display='flex' gap={2} justifyContent='center'>
              <ReportProblemIcon sx={{ color: 'var(--danger-text)' }} fontSize='small' />
              <Typography color='secondary' variant='caption'>
                Authentication has expired. Please reconnect your Google account
              </Typography>
            </Box>
          </ListItem>
        </>
      );
    }
    return (
      <Typography color='error' variant='caption'>
        Error loading forms
      </Typography>
    );
  }
  if (!forms) return <LoadingComponent />;
  return (
    <>
      {forms.map((form) => (
        <Tooltip key={form.id} title={form.name} enterDelay={1000}>
          <MenuItem dense onClick={() => selectForm(form)}>
            <ListItemIcon>
              <FormatListBulletedIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary={
                <Link onClick={(e) => e.nativeEvent.preventDefault()} href={form.url}>
                  {form.name}
                </Link>
              }
            />
          </MenuItem>
        </Tooltip>
      ))}
    </>
  );
}
