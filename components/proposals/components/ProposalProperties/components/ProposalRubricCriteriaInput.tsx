import type { ProposalRubricCriteriaAnswer, ProposalStatus } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { TextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import DraggableListItem from 'components/common/PageLayout/components/DraggableListItem';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import { getNumberFromString } from 'lib/utilities/numbers';

export type RangeProposalCriteria = {
  id: string;
  title: string;
  description?: string | null;
  type: 'range';
  parameters: { min: number | null; max: number | null };
};

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  proposalStatus?: ProposalStatus;
  value: RangeProposalCriteria[];
  onChange: (criteria: RangeProposalCriteria[]) => void;
  answers: ProposalRubricCriteriaAnswer[];
};

export const CriteriaRow = styled(Box)`
  .show-on-hover {
    opacity: 0;
    transform: opacity 0.2s ease-in-out;
  }
  &:hover {
    .show-on-hover {
      opacity: 1;
    }
    .octo-propertyvalue:not(.readonly) {
      background-color: var(--mui-action-hover);
    }
  }
  .to-pseudo-element {
    position: relative;
  }
  .to-pseudo-element::before {
    content: '-';
    left: -8px;
    top: 4px;
    position: absolute;
    font-size: 16px;
    color: var(--secondary-text);
  }
`;

export function ProposalRubricCriteriaInput({
  readOnly,
  readOnlyMessage,
  value,
  onChange,
  proposalStatus,
  answers
}: Props) {
  const [criteriaList, setCriteriaList] = useState<RangeProposalCriteria[]>([]);

  const [rubricCriteriaIdToDelete, setRubricCriteriaIdToDelete] = useState<string | null>(null);
  function addCriteria() {
    if (readOnly) {
      return;
    }
    const lastCriteria = criteriaList[criteriaList.length - 1]?.parameters;
    const parameters = { min: lastCriteria?.min || 1, max: lastCriteria?.max || 5 };
    const newCriteria: RangeProposalCriteria = {
      id: uuid(),
      description: '',
      title: '',
      type: 'range',
      parameters
    };
    const updatedList = [...criteriaList, newCriteria];
    setCriteriaList(updatedList);
    // onChange(criteriaList); - no need to update the backend immediately something is entered?
  }

  function deleteCriteria(id: string) {
    if (readOnly || !id) {
      return;
    }
    setRubricCriteriaIdToDelete(null);
    const updatedList = criteriaList.filter((c) => c.id !== id);
    setCriteriaList(updatedList);

    onChange(updatedList);
  }

  function setCriteriaProperty(id: string, updates: Partial<RangeProposalCriteria>) {
    if (readOnly) {
      return;
    }
    const criteria = criteriaList.find((c) => c.id === id);
    if (criteria) {
      Object.assign(criteria, updates);
      setCriteriaList([...criteriaList]);
      if (criteriaList.every((rubricCriteria) => isValidCriteria(rubricCriteria, answers))) {
        onChange(criteriaList);
      }
    }
  }

  useEffect(() => {
    setCriteriaList(value);
  }, [value]);

  function handleClickDelete(criteriaId: string) {
    if (proposalStatus === 'evaluation_active') {
      setRubricCriteriaIdToDelete(criteriaId);
    } else {
      deleteCriteria(criteriaId);
    }
  }
  async function changeOptionsOrder(draggedProperty: string, droppedOnProperty: string) {
    const newOrder = [...value];
    const propIndex = newOrder.findIndex((val) => val.id === draggedProperty); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((val) => val.id === droppedOnProperty); // find the index of the space that was dropped on
    newOrder.splice(droppedOnIndex, 0, deletedElements[0]); // add the property to the new index
    setCriteriaList(newOrder);
  }

  return (
    <>
      {criteriaList.map((criteria) => (
        <DraggableListItem
          key={criteria.id}
          name='rubric-option'
          itemId={criteria.id}
          changeOrderHandler={changeOptionsOrder}
        >
          <Box display='flex'>
            <MenuIcon fontSize='small' sx={{ mt: '7px' }} />
            <Box key={criteria.id} display='flex' flexDirection='column'>
              <CriteriaRow display='flex' alignItems='flex-start' gap={1} mb={1}>
                <TextInput
                  inputProps={{ autoFocus: true }}
                  displayType='details'
                  fullWidth={false}
                  onChange={(title) => setCriteriaProperty(criteria.id, { title })}
                  placeholderText='Add a label...'
                  readOnly={readOnly}
                  readOnlyMessage={readOnlyMessage}
                  value={criteria.title}
                />
                <TextInput
                  displayType='details'
                  multiline={true}
                  onChange={(description) => setCriteriaProperty(criteria.id, { description })}
                  placeholderText='Add a description...'
                  readOnly={readOnly}
                  sx={{ flexGrow: 1, width: '100%' }}
                  value={criteria.description ?? ''}
                />
                <Box display='flex' gap={1} alignItems='flex-start'>
                  <Grid container width={90} spacing={1}>
                    <Grid xs item>
                      <div>
                        <IntegerInput
                          onChange={(min) => {
                            setCriteriaProperty(criteria.id, {
                              parameters: { ...criteria.parameters, min }
                            });
                          }}
                          readOnly={readOnly}
                          readOnlyMessage={readOnlyMessage}
                          value={criteria.parameters.min}
                        />
                        <Typography
                          align='center'
                          component='div'
                          className='show-on-hover'
                          color='secondary'
                          variant='caption'
                        >
                          min
                        </Typography>
                      </div>
                    </Grid>
                    <Grid xs item>
                      <div className='to-pseudo-element'>
                        <IntegerInput
                          inputProps={{
                            min: typeof criteria.parameters.min === 'number' ? criteria.parameters.min + 1 : undefined
                          }}
                          onChange={(max) => {
                            setCriteriaProperty(criteria.id, {
                              parameters: { ...criteria.parameters, max }
                            });
                          }}
                          readOnly={readOnly}
                          readOnlyMessage={readOnlyMessage}
                          value={criteria.parameters.max}
                        />
                        <Typography
                          align='center'
                          component='div'
                          className='show-on-hover'
                          variant='caption'
                          color='secondary'
                        >
                          max
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </Box>
                {!readOnly && (
                  <div className='show-on-hover delete-icon'>
                    <Tooltip title='Delete'>
                      <IconButton size='small' onClick={() => handleClickDelete(criteria.id)}>
                        <DeleteIcon color='secondary' fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </div>
                )}
              </CriteriaRow>
            </Box>
          </Box>
        </DraggableListItem>
      ))}
      {!readOnly && (
        <ConfirmDeleteModal
          title='Confirm criteria deletion'
          open={!!rubricCriteriaIdToDelete}
          onClose={() => setRubricCriteriaIdToDelete(null)}
          buttonText='Delete rubric criteria'
          onConfirm={() => {
            deleteCriteria(rubricCriteriaIdToDelete!);
          }}
          question='Are you sure you want to delete this criteria? Any linked answers will also be deleted'
        />
      )}
      {!readOnly && (
        <AddAPropertyButton style={{ flex: 'none', margin: 0 }} onClick={addCriteria}>
          + Add a criteria
        </AddAPropertyButton>
      )}
    </>
  );
}
export function IntegerInput({
  value,
  onChange,
  readOnly,
  readOnlyMessage,
  inputProps,
  maxWidth,
  sx
}: {
  value?: number | string | null;
  onChange: (num: number | null) => void;
  readOnly?: boolean;
  readOnlyMessage?: string;
  inputProps?: any;
  maxWidth?: number;
  sx?: any;
}) {
  return (
    <TextInput
      displayType='details'
      fullWidth={!maxWidth}
      inputProps={{ type: 'number', ...inputProps }}
      onChange={(newValue) => onChange(getNumberFromString(newValue))}
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      sx={{
        input: { textAlign: 'center', minWidth: '2.5em !important', maxWidth },
        ...sx
      }}
      value={value?.toString() || ''}
    />
  );
}

function isValidCriteria(criteria: RangeProposalCriteria, rubricAnswers: ProposalRubricCriteriaAnswer[]) {
  const min = criteria.parameters.min;
  const max = criteria.parameters.max;
  for (const answer of rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[]) {
    if (
      (answer.rubricCriteriaId === criteria.id && typeof min === 'number' && answer.response.score < min) ||
      (typeof max === 'number' && answer.response.score > max)
    ) {
      return false;
    }
  }

  if (criteria.type === 'range') {
    if (
      (!criteria.parameters.min && criteria.parameters.min !== 0) ||
      (!criteria.parameters.max && criteria.parameters.max !== 0)
    ) {
      // Range values are invalid
      return false;
    }
    if (criteria.parameters.min >= criteria.parameters.max) {
      // Minimum must be less than Maximum
      return false;
    }
    return true;
  }
  // unrecognized type
  throw new Error(`Unrecognized criteria type: ${criteria.type}`);
}
