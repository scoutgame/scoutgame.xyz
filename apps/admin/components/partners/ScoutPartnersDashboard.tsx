'use client';

import type { ScoutPartner } from '@charmverse/core/prisma';
import { Container, Typography, Stack, Button, Modal, Box } from '@mui/material';
import { useState } from 'react';

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

export function ScoutPartnersDashboard({ initialPartners }: { initialPartners: ScoutPartner[] }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [partners, setPartners] = useState(initialPartners);

  const handlePartnerUpdate = (updatedPartner: ScoutPartner) => {
    setPartners((prevPartners) =>
      prevPartners.map((partner) => (partner.id === updatedPartner.id ? updatedPartner : partner))
    );
  };

  return (
    <Container maxWidth='xl'>
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' mb={2}>
        <Typography variant='h5'>Scout Partners</Typography>
        <Button variant='contained' onClick={() => setShowCreateForm(true)}>
          Create Partner
        </Button>
      </Stack>

      <ScoutPartnersTable partners={partners} isLoading={false} onPartnerUpdate={handlePartnerUpdate} />

      <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <Box sx={modalStyle}>
          <CreateScoutPartnerForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={(newPartner) => {
              setPartners([...partners, newPartner]);
              setShowCreateForm(false);
            }}
          />
        </Box>
      </Modal>
    </Container>
  );
}
