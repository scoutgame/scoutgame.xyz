import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Box, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';

import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { isTruthy } from 'lib/utilities/types';

import { SelectPreviewContainer } from '../SelectProperty/SelectProperty';

type Props = {
  memberIds: string[];
  readOnly: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
  displayType?: PropertyValueDisplayType;
  wrapColumn?: boolean;
};

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};

const StyledUserPropertyContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'displayType'
})<ContainerProps>`
  flex-grow: 1;

  ${(props) =>
    props.displayType === 'details'
      ? `
      .MuiInputBase-root {
        padding: 4px 8px;
      }
      `
      : ''}

  // override styles from focalboard
  .MuiInputBase-input {
    background: transparent;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  // dont let the input extend over neighbor columns in table mode when it is expanded
  overflow: ${(props) => (props.displayType === 'table' ? 'hidden' : 'initial')};

  ${(props) =>
    props.displayType !== 'table'
      ? `
        // & .MuiInputBase-root,
        // & input.MuiInputBase-input {
        //   /** this overflows to the next line on smaller width */
        //   position: absolute;
        // }
      `
      : ''}
`;
function MembersDisplay({
  memberIds,
  readOnly,
  setMemberIds,
  wrapColumn
}: {
  wrapColumn: boolean;
  readOnly: boolean;
  memberIds: string[];
  setMemberIds: (memberIds: string[]) => void;
}) {
  const { membersRecord } = useMembers();

  function removeMember(memberId: string) {
    if (!readOnly) {
      setMemberIds(memberIds.filter((_memberId) => _memberId !== memberId));
    }
  }

  const members = memberIds.map((memberId) => membersRecord[memberId]).filter(isTruthy);

  return memberIds.length === 0 ? null : (
    <Stack flexDirection='row' gap={1}>
      {members.map((user) => {
        return (
          <Stack
            alignItems='center'
            flexDirection='row'
            key={user.id}
            gap={0.5}
            sx={
              wrapColumn
                ? { width: '100%', justifyContent: 'space-between', overflowX: 'hidden' }
                : { overflowX: 'hidden' }
            }
          >
            <UserDisplay fontSize={14} avatarSize='xSmall' user={user} wrapName={wrapColumn} />
            {!readOnly && (
              <IconButton size='small' onClick={() => removeMember(user.id)}>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  fontSize='small'
                  color='secondary'
                />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

export function UserProperty({
  displayType,
  memberIds,
  onChange,
  readOnly,
  showEmptyPlaceholder,
  wrapColumn
}: Props): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);

  const _onChange = useCallback(
    (newMemberIds: string[]) => {
      if (!readOnly) {
        onChange(newMemberIds);
      }
    },
    [readOnly]
  );

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  if (!isOpen) {
    return (
      <SelectPreviewContainer isHidden={isOpen} displayType={displayType} onClick={onClickToEdit}>
        {showEmptyPlaceholder && memberIds.length === 0 ? (
          <Typography component='span' variant='subtitle2' color='secondary'>
            Empty
          </Typography>
        ) : (
          <MembersDisplay
            wrapColumn={wrapColumn ?? false}
            readOnly={true}
            memberIds={memberIds}
            setMemberIds={_onChange}
          />
        )}
      </SelectPreviewContainer>
    );
  }
  return (
    <StyledUserPropertyContainer displayType={displayType}>
      <InputSearchMemberMultiple
        // sx={{ '& .MuiAutocomplete-paper': { margin: 0, marginTop: '-20px' } }}
        disableClearable
        clearOnBlur
        open
        openOnFocus
        disableCloseOnSelect
        defaultValue={memberIds}
        onClose={() => setIsOpen(false)}
        fullWidth
        onChange={_onChange}
        getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
        readOnly={readOnly}
        placeholder={memberIds.length === 0 ? 'Search for an option...' : ''}
        inputVariant='standard'
        renderTags={() => (
          <MembersDisplay wrapColumn={true} readOnly={readOnly} memberIds={memberIds} setMemberIds={_onChange} />
        )}
      />
    </StyledUserPropertyContainer>
  );
}
