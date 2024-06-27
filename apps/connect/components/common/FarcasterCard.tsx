import { Avatar } from '@connect/components/common/Avatar';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Stack } from '@mui/system';

export function FarcasterCard({
  name,
  username,
  avatar,
  bio
}: {
  name: string;
  bio?: string;
  username: string;
  avatar?: string;
}) {
  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: {
            xs: 'column',
            sm: 'row'
          }
        }}
      >
        <Stack
          alignItems={{
            xs: 'center',
            sm: 'flex-start'
          }}
        >
          <Avatar size='xLarge' name={username} avatar={avatar} />
        </Stack>
        <Box>
          <Typography variant='h6'>{name}</Typography>
          <Typography>{username}</Typography>
          <Typography>{bio}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
