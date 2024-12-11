'use client';

import { Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { useEffect } from 'react';

export function TelegramLogin({ user }: { user: SessionUser }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'scoutgame_safwan_dev_bot');
    script.setAttribute('data-size', 'medium');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-radius', '4');
    script.setAttribute('data-auth-url', 'https://scoutgame.loca.lt/api/telegram/callback');
    document.getElementById('telegram-login-container')?.appendChild(script);
  }, []);

  return (
    <Stack gap={1}>
      <Typography variant='h5'>Telegram</Typography>
      {user.telegramId ? (
        <Typography variant='body1'>{user.telegramId}</Typography>
      ) : (
        <div id='telegram-login-container' />
      )}
    </Stack>
  );
}
