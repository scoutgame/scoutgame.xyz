import { Button } from '@mui/material';
import Link from 'next/link';

export function PlayButton() {
  return (
    <Link href='https://draft.scoutgame.xyz'>
      <Button
        variant='contained'
        sx={{
          mt: {
            xs: 1,
            md: 2
          },
          width: 'fit-content'
        }}
      >
        Play
      </Button>
    </Link>
  );
}
