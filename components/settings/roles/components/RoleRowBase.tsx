import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/LockOutlined';
import {
  Box,
  Grid,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Chip,
  Divider,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import Modal from 'components/common/Modal';
import type { Member } from 'lib/members/interfaces';

import { MemberRow } from './MemberRow';

type RoleRowProps = {
  readOnlyMembers?: boolean;
  title: string;
  description?: string | ReactNode;
  members: Member[];
  eligibleMembers: Member[];
  onAddMembers?: (memberIds: string[]) => Promise<void>;
  permissions?: ReactNode;
  roleActions?: ReactNode;
  memberRoleId?: string;
};

const ScrollableBox = styled.div<{ rows: number }>`
  max-height: 300px; // about 5 rows * 60px
  overflow: auto;
  ${({ theme, rows }) => rows > 5 && `border-bottom: 1px solid ${theme.palette.divider}`};
`;

export function RoleRowBase({
  description,
  roleActions,
  eligibleMembers,
  memberRoleId,
  readOnlyMembers,
  title,
  permissions,
  onAddMembers,
  members
}: RoleRowProps) {
  const [openTab, setOpenTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setOpenTab(newValue);
  };
  return (
    <>
      <Divider />
      <Paper sx={{ my: 1 }}>
        <Accordion style={{ boxShadow: 'none' }} data-test={`role-row-${title}`}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='h6' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {title}
                  <Chip size='small' label={members.length} />
                </Typography>
              </Box>
              <div onClick={(e) => e.stopPropagation()}>{roleActions}</div>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 0 }}>
            <Tabs value={openTab} onChange={handleChange}>
              <Tab label='Users' />
              <Tab label='Permissions' data-test='role-settings-permissions-tab' />
            </Tabs>
            <TabPanel value={openTab} index={0}>
              <ScrollableBox rows={members.length}>
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} readOnly={!!readOnlyMembers} memberRoleId={memberRoleId} />
                ))}
              </ScrollableBox>
              {members.length === 0 && (
                <Typography variant='caption' color='textSecondary'>
                  No users
                </Typography>
              )}
              {onAddMembers && (
                <AddMembersButton
                  memberIds={members.map((m) => m.id)}
                  eligibleMemberIds={eligibleMembers.map((m) => m.id)}
                  onAddMembers={onAddMembers}
                />
              )}
            </TabPanel>
            <TabPanel value={openTab} index={1}>
              {description && (
                <Box mb={2} display='flex' gap={1} alignItems='center'>
                  <LockIcon />
                  <Typography variant='caption'>{description}</Typography>
                </Box>
              )}
              {description && permissions && <Divider sx={{ mb: 2 }} />}
              {permissions}
            </TabPanel>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </>
  );
}

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box py={2}>{children}</Box>}
    </div>
  );
}

type ButtonProps = {
  onAddMembers: (memberIds: string[]) => Promise<void>;
  memberIds: string[];
  eligibleMemberIds: string[];
};

function AddMembersButton({ onAddMembers, memberIds, eligibleMemberIds }: ButtonProps) {
  const [newMembers, setNewMembers] = useState<string[]>([]);

  const userPopupState = usePopupState({ variant: 'popover', popupId: `add-members-input` });
  function showMembersPopup() {
    setNewMembers([]);
    userPopupState.open();
  }

  function onChangeNewMembers(ids: string[]) {
    setNewMembers(ids);
  }
  async function addMembers() {
    await onAddMembers(newMembers);
    userPopupState.close();
  }

  return (
    <Box mt={2}>
      {eligibleMemberIds.length > 0 ? (
        <Button onClick={showMembersPopup} variant='text' color='secondary'>
          + Add members
        </Button>
      ) : (
        <Typography variant='caption'>All eligible members have been added to this role</Typography>
      )}
      <Modal open={userPopupState.isOpen} onClose={userPopupState.close} title='Add members'>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InputSearchMemberMultiple filter={{ mode: 'exclude', userIds: memberIds }} onChange={onChangeNewMembers} />
          </Grid>
          <Grid item>
            <Button disabled={newMembers.length === 0} onClick={addMembers}>
              Add
            </Button>
          </Grid>
        </Grid>
      </Modal>
    </Box>
  );
}
