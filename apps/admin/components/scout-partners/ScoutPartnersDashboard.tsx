'use client';

import { Container, Typography, Stack, Button, Modal, Box } from '@mui/material';
import { useState } from 'react';

import { useScoutPartners } from 'hooks/api/scout-partners';

import { CreateScoutPartnerForm } from './CreateScoutPartnerForm';
import { ScoutPartnersTable } from './ScoutPartnersTable';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflow: 'auto'
};

export function ScoutPartnersDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: partners, isLoading } = useScoutPartners();

  return (
    <Container maxWidth='xl'>
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' mb={2}>
        <Typography variant='h5'>Scout Partners</Typography>
        <Button variant='contained' onClick={() => setShowCreateForm(true)}>
          Create Partner
        </Button>
      </Stack>

      <ScoutPartnersTable partners={partners} isLoading={isLoading} />

      <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <Box sx={modalStyle}>
          <CreateScoutPartnerForm onClose={() => setShowCreateForm(false)} />
        </Box>
      </Modal>
    </Container>
  );
}
