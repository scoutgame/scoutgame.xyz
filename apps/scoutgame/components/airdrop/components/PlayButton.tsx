import { Button } from '@mui/material';
import Link from 'next/link';

export function PlayButton() {
  return (
    <Link href='/draft'>
      <Button
        variant='blue'
        sx={{
          mt: {
            xs: 1,
            md: 2
          },
          width: 250,
          py: 1,
          borderRadius: 2
        }}
      >
        Play
      </Button>
    </Link>
  );
}
