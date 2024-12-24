import { Stack, Typography } from '@mui/material';

export function StarterPackCardDetails({
  name,
  ecosystem,
  description,
  noTrim
}: {
  name: string;
  ecosystem: string;
  description: string;
  noTrim?: boolean;
}) {
  return (
    <Stack gap={0.5}>
      <Typography variant='h6' fontWeight='bold' textAlign='center'>
        {name}
      </Typography>
      <Typography variant='body2' color='green.main' fontWeight='bold' textAlign='center' fontStyle='italic'>
        {ecosystem}
      </Typography>
      <Typography
        width='fit-container'
        variant='body2'
        sx={{
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: noTrim ? 'block' : '-webkit-box',
          WebkitLineClamp: { xs: 7, md: 'initial' },
          WebkitBoxOrient: 'vertical'
        }}
      >
        {description}
      </Typography>
    </Stack>
  );
}
