import { Divider, Typography } from '@mui/material';
import MultiSigList from './MultiSigList';

export default function MyIntegrations () {

  return (
    <>
      <Typography variant='h1' gutterBottom>Integrations</Typography>
      <Divider sx={{ mt: 2, mb: 3 }} />
      <MultiSigList />
    </>
  );
}
