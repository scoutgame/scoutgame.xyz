import type { ApplicationStatus, ProposalSystemRole } from '@charmverse/core/prisma';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Link, Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { EmptyPlaceholder } from 'components/common/BoardEditor/components/properties/EmptyPlaceholder';
import { RelationPropertyPagesAutocomplete } from 'components/common/BoardEditor/components/properties/RelationPropertyPagesAutocomplete';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { BreadcrumbPageTitle } from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import { ProposalStatusSelect } from 'components/proposals/components/ProposalStatusSelect';
import { ProposalStepSelect } from 'components/proposals/components/ProposalStepSelect';
import { ProposalNotesLink } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/ProposalNotesLink';
import {
  REWARD_APPLICATION_STATUS_LABELS,
  RewardApplicationStatusChip
} from 'components/rewards/components/RewardApplicationStatusChip';
import { RewardStatusChip } from 'components/rewards/components/RewardChip';
import { allMembersSystemRole, authorSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { proposalPropertyTypesList } from 'lib/focalboard/board';
import type { Card, CardPage } from 'lib/focalboard/card';
import {
  EVALUATION_STATUS_LABELS,
  PROPOSAL_STEP_LABELS,
  proposalStatusColors
} from 'lib/focalboard/proposalDbProperties';
import { PROPOSAL_STATUS_BLOCK_ID, PROPOSAL_STEP_BLOCK_ID } from 'lib/proposal/blocks/constants';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalEvaluationResultExtended, ProposalEvaluationStep } from 'lib/proposal/interface';
import {
  REWARDS_APPLICANTS_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_APPLICANTS_COUNT,
  REWARD_CHAIN,
  REWARD_PROPOSAL_LINK,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  REWARD_TOKEN
} from 'lib/rewards/blocks/constants';
import type { RewardStatus } from 'lib/rewards/interfaces';
import { getAbsolutePath } from 'lib/utilities/browser';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { TextInput } from '../../../components/properties/TextInput';
import type { Mutator } from '../mutator';
import defaultMutator from '../mutator';
import { OctoUtils } from '../octoUtils';
import Checkbox from '../widgets/checkbox';

import CreatedAt from './properties/createdAt/createdAt';
import CreatedBy from './properties/createdBy/createdBy';
import DateRange from './properties/dateRange/dateRange';
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt';
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy';
import URLProperty from './properties/link/link';
import { TokenAmount } from './properties/tokenAmount/tokenAmount';
import { TokenChain } from './properties/tokenChain/tokenChain';

type Props = {
  board: Board;
  readOnly: boolean;
  card: Card;
  syncWithPageId?: string | null;
  updatedBy: string;
  updatedAt: string;
  propertyTemplate: IPropertyTemplate;
  showEmptyPlaceholder: boolean;
  displayType?: PropertyValueDisplayType;
  showTooltip?: boolean;
  wrapColumn?: boolean;
  columnRef?: React.RefObject<HTMLDivElement>;
  mutator?: Mutator;
  subRowsEmptyValueContent?: ReactElement | string;
  proposal?: CardPage['proposal'];
};

export const validatePropertyValue = (propType: string, val: string): boolean => {
  if (val === '') {
    return true;
  }
  switch (propType) {
    case 'number':
      return !Number.isNaN(parseInt(val, 10));
    case 'email': {
      const emailRegexp =
        // eslint-disable-next-line max-len
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{"mixer na 8 chainach1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return emailRegexp.test(val);
    }
    case 'url': {
      const urlRegexp =
        // eslint-disable-next-line max-len
        /(((.+:(?:\/\/)?)?(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;
      return urlRegexp.test(val);
    }
    case 'text':
      return true;
    case 'phone':
      return true;
    default:
      return false;
  }
};

/**
 * Hide these values if user is not an evalutor for the proposal
 */

const editableFields: PropertyType[] = ['text', 'number', 'email', 'url', 'phone'];

function PropertyValueElement(props: Props) {
  const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '');
  const { formatDateTime, formatDate } = useDateFormatter();
  const { showError } = useSnackbar();
  const {
    card,
    propertyTemplate,
    showEmptyPlaceholder,
    board,
    updatedBy,
    updatedAt,
    displayType,
    mutator = defaultMutator,
    subRowsEmptyValueContent,
    proposal
  } = props;
  const { trigger } = useUpdateProposalEvaluation({ proposalId: proposal?.id });

  const isAdmin = useIsAdmin();
  const intl = useIntl();
  const propertyValue = card.fields.properties[propertyTemplate.id];
  const cardProperties = board.fields.cardProperties;
  const cardProperty = cardProperties.find((_cardProperty) => _cardProperty.id === propertyTemplate.id);
  const readOnly =
    proposal?.archived || props.readOnly || !!cardProperty?.formFieldId || !!cardProperty?.proposalFieldId;

  const displayValue = OctoUtils.propertyDisplayValue({
    block: card,
    propertyValue,
    propertyTemplate,
    formatters: {
      date: formatDate,
      dateTime: formatDateTime
    }
  });

  const emptyDisplayValue = showEmptyPlaceholder
    ? intl.formatMessage({ id: 'PropertyValueElement.empty', defaultMessage: 'Empty' })
    : '';
  const router = useRouter();
  const domain = router.query.domain as string;

  const latestUpdated = new Date(updatedAt).getTime() > new Date(card.updatedAt).getTime() ? 'page' : 'card';

  useEffect(() => {
    if (serverValue === value) {
      setValue(props.card.fields.properties[props.propertyTemplate.id] || '');
    }
    setServerValue(props.card.fields.properties[props.propertyTemplate.id] || '');
  }, [value, props.card.fields.properties[props.propertyTemplate.id]]);

  let propertyValueElement: ReactNode = null;

  if (propertyTemplate.id === REWARD_STATUS_BLOCK_ID) {
    if (REWARD_APPLICATION_STATUS_LABELS[propertyValue as ApplicationStatus]) {
      return <RewardApplicationStatusChip status={propertyValue as ApplicationStatus} />;
    }
    return <RewardStatusChip status={propertyValue as RewardStatus} showIcon={false} />;
  } else if (propertyTemplate.type === 'proposalReviewerNotes') {
    return <ProposalNotesLink pageId={props.card.id} />;
  }
  // Proposals as datasource use proposalStatus column, whereas the actual proposals table uses STATUS_BLOCK_ID
  // We should migrate over the proposals as datasource blocks to the same format as proposals table
  else if (propertyTemplate.type === 'proposalStatus' || propertyTemplate.id === PROPOSAL_STATUS_BLOCK_ID) {
    if (proposal) {
      return <ProposalStatusSelect proposal={proposal} readOnly={!isAdmin} displayType={displayType} />;
    }

    const evaluationTypeProperty = board.fields.cardProperties.find(
      (_cardProperty) => _cardProperty.type === 'proposalEvaluationType'
    );
    const evaluationType = card.fields.properties[evaluationTypeProperty?.id ?? ''] as ProposalEvaluationStep;
    const proposalEvaluationStatus = getProposalEvaluationStatus({
      result: propertyValue as ProposalEvaluationResultExtended,
      step: evaluationType
    });

    return (
      <TagSelect
        wrapColumn
        readOnly
        options={[
          {
            color: proposalStatusColors[proposalEvaluationStatus],
            id: proposalEvaluationStatus,
            value: EVALUATION_STATUS_LABELS[proposalEvaluationStatus]
          }
        ]}
        propertyValue={proposalEvaluationStatus}
        onChange={() => {}}
        displayType={displayType}
      />
    );
  } else if (propertyTemplate.type === 'proposalStep' || propertyTemplate.id === PROPOSAL_STEP_BLOCK_ID) {
    if (!proposal) {
      return (
        <TagSelect
          wrapColumn
          includeSelectedOptions
          readOnly
          options={propertyTemplate.options}
          propertyValue={(propertyValue as string) ?? ''}
          onChange={() => {}}
          displayType={displayType}
        />
      );
    }
    return <ProposalStepSelect readOnly={!isAdmin} proposal={proposal} displayType={displayType} />;
  } else if (propertyTemplate.type === 'proposalEvaluationType') {
    return (
      <TagSelect
        wrapColumn
        includeSelectedOptions
        readOnly
        options={[
          {
            color: 'gray',
            id: propertyValue as string,
            value: PROPOSAL_STEP_LABELS[propertyValue as ProposalEvaluationStep]
          }
        ]}
        propertyValue={propertyValue as string}
        onChange={() => {}}
        displayType={displayType}
      />
    );
  } else if (propertyTemplate.id === REWARD_PROPOSAL_LINK) {
    if (!Array.isArray(propertyValue) || !propertyValue.length || !propertyValue[0]) {
      return null;
    }

    return (
      <Box sx={{ a: { color: 'inherit' } }}>
        <Link href={getAbsolutePath(propertyValue[1] as string, domain)}>
          <BreadcrumbPageTitle sx={{ maxWidth: 160 }}>{propertyValue[0]}</BreadcrumbPageTitle>
        </Link>
      </Box>
    );
  } else if (propertyTemplate.id === REWARD_REVIEWERS_BLOCK_ID && propertyTemplate.type !== 'proposalReviewer') {
    if (Array.isArray(propertyValue) && propertyValue.length === 0 && subRowsEmptyValueContent) {
      return typeof subRowsEmptyValueContent === 'string' ? (
        <span>{subRowsEmptyValueContent}</span>
      ) : (
        subRowsEmptyValueContent ?? null
      );
    }
    return (
      <UserAndRoleSelect
        displayType={displayType}
        data-test='selected-reviewers'
        readOnly={readOnly || proposalPropertyTypesList.includes(propertyTemplate.type as any)}
        onChange={() => null}
        systemRoles={[allMembersSystemRole, authorSystemRole]}
        value={propertyValue as any}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
      />
    );
  } else if (propertyTemplate.relationData && propertyTemplate.type === 'relation') {
    return (
      <RelationPropertyPagesAutocomplete
        boardProperties={board.fields.cardProperties}
        propertyTemplate={propertyTemplate}
        selectedPageListItemIds={
          typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? []
        }
        displayType={displayType}
        emptyPlaceholderContent={emptyDisplayValue}
        showEmptyPlaceholder={showEmptyPlaceholder}
        onChange={async (pageListItemIds) => {
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, pageListItemIds);
          } catch (error) {
            showError(error);
          }
        }}
        readOnly={readOnly}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
      />
    );
  } else if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') {
    propertyValueElement = (
      <TagSelect
        data-test='closed-select-input'
        dataTestActive='active-select-autocomplete'
        canEditOptions={!readOnly && !proposalPropertyTypesList.includes(propertyTemplate.type as any)}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        multiselect={propertyTemplate.type === 'multiSelect'}
        readOnly={readOnly || proposalPropertyTypesList.includes(propertyTemplate.type as any)}
        propertyValue={propertyValue as string}
        options={propertyTemplate.options}
        onChange={async (newValue) => {
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
          } catch (error) {
            showError(error);
          }
        }}
        onUpdateOption={async (option) => {
          try {
            await mutator.changePropertyOption(board, propertyTemplate, option);
          } catch (error) {
            showError(error);
          }
        }}
        onDeleteOption={async (option) => {
          try {
            await mutator.deletePropertyOption(board, propertyTemplate, option);
          } catch (error) {
            showError(error);
          }
        }}
        onCreateOption={async (newValue) => {
          try {
            await mutator.insertPropertyOption(board, propertyTemplate, newValue, 'add property option');
          } catch (error) {
            showError(error);
          }
        }}
        displayType={displayType}
      />
    );
    // Do not show  applicants in regular reward
  } else if (
    propertyTemplate.id === REWARDS_APPLICANTS_BLOCK_ID &&
    Array.isArray(propertyValue) &&
    !card.fields.isAssigned
  ) {
    propertyValueElement = null;
  } else if (
    propertyTemplate.type === 'person' ||
    propertyTemplate.type === 'proposalEvaluatedBy' ||
    propertyTemplate.id === REWARDS_APPLICANTS_BLOCK_ID
  ) {
    propertyValueElement = (
      <UserSelect
        displayType={displayType}
        memberIds={typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? []}
        readOnly={
          readOnly ||
          (displayType !== 'details' && displayType !== 'table') ||
          proposalPropertyTypesList.includes(propertyTemplate.type as any)
        }
        onChange={async (newValue) => {
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
            const previousValue = propertyValue
              ? typeof propertyValue === 'string'
                ? [propertyValue]
                : (propertyValue as string[])
              : [];
            const newUserIds = newValue.filter((id) => !previousValue.includes(id));
            Promise.all(
              newUserIds.map((userId) =>
                charmClient.createEvents({
                  spaceId: board.spaceId,
                  payload: [
                    {
                      cardId: card.id,
                      cardProperty: {
                        id: propertyTemplate.id,
                        name: propertyTemplate.name,
                        value: userId
                      },
                      scope: WebhookEventNames.CardPersonPropertyAssigned
                    }
                  ]
                })
              )
            );
          } catch (error) {
            showError(error);
          }
        }}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        showEmptyPlaceholder={showEmptyPlaceholder}
      />
    );
  } else if (propertyTemplate.type === 'proposalReviewer') {
    propertyValueElement = (
      <UserAndRoleSelect
        readOnly={
          !proposal ||
          readOnly ||
          (displayType !== 'details' && displayType !== 'table') ||
          proposal.currentStep?.step === 'draft' ||
          !!proposal.sourceTemplateId
        }
        required
        data-test='selected-reviewers'
        systemRoles={[allMembersSystemRole, authorSystemRole]}
        onChange={async (reviewers) => {
          const evaluationId = proposal?.currentEvaluationId;
          if (evaluationId) {
            try {
              await trigger({
                reviewers: reviewers.map((reviewer) => ({
                  roleId: reviewer.group === 'role' ? reviewer.id : null,
                  systemRole: reviewer.group === 'system_role' ? (reviewer.id as ProposalSystemRole) : null,
                  userId: reviewer.group === 'user' ? reviewer.id : null
                })),
                evaluationId
              });
              await mutate(`/api/spaces/${card.spaceId}/proposals`);
            } catch (err) {
              showError(err, 'Failed to update proposal reviewers');
            }
          }
        }}
        value={propertyValue as any}
        showEmptyPlaceholder={showEmptyPlaceholder}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        displayType={displayType}
      />
    );
  } else if (propertyTemplate.type === 'proposalAuthor') {
    propertyValueElement = (
      <UserSelect
        displayType={displayType}
        memberIds={typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? []}
        readOnly={readOnly || (displayType !== 'details' && displayType !== 'table')}
        onChange={async (newValue) => {
          if (proposal) {
            try {
              await charmClient.proposals.updateProposal({
                proposalId: proposal.id,
                authors: newValue
              });
              await mutate(`/api/spaces/${board.spaceId}/proposals`);
            } catch (error) {
              showError(error);
            }
          }
        }}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        showEmptyPlaceholder={showEmptyPlaceholder}
      />
    );
  } else if (propertyTemplate.type === 'date') {
    if (readOnly) {
      propertyValueElement = (
        <Box
          className='octo-propertyvalue readonly'
          display='flex'
          alignItems={displayType !== 'table' ? 'center' : 'flex-start'}
          sx={{ whiteSpace: displayType !== 'table' || props.wrapColumn ? 'break-spaces' : 'nowrap' }}
        >
          {displayValue || (showEmptyPlaceholder && <EmptyPlaceholder>{emptyDisplayValue}</EmptyPlaceholder>)}
        </Box>
      );
    } else {
      propertyValueElement = (
        <DateRange
          centerContent={displayType !== 'table'}
          wrapColumn={props.wrapColumn}
          className='octo-propertyvalue'
          value={value.toString()}
          key={value.toString()}
          showEmptyPlaceholder={showEmptyPlaceholder}
          onChange={async (newValue) => {
            try {
              await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
            } catch (error) {
              showError(error);
            }
          }}
        />
      );
    }
  } else if (propertyTemplate.type === 'checkbox') {
    propertyValueElement = (
      <Checkbox
        displayType={displayType}
        label={propertyTemplate.name}
        isOn={propertyValue === 'true'}
        onChanged={async (newBool) => {
          const newValue = newBool ? 'true' : '';
          try {
            await mutator.changePropertyValue(card, propertyTemplate.id, newValue);
          } catch (error) {
            showError(error);
          }
        }}
        readOnly={readOnly}
      />
    );
  } else if (propertyTemplate.type === 'createdBy') {
    propertyValueElement = <CreatedBy userId={card.createdBy} />;
  } else if (propertyTemplate.type === 'updatedBy') {
    propertyValueElement = <LastModifiedBy updatedBy={latestUpdated === 'card' ? card.updatedBy : updatedBy} />;
  } else if (propertyTemplate.type === 'createdTime') {
    propertyValueElement = (
      <CreatedAt
        createdAt={card.createdAt}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        centerContent={displayType !== 'table'}
      />
    );
  } else if (propertyTemplate.type === 'updatedTime') {
    propertyValueElement = (
      <LastModifiedAt
        updatedAt={new Date(latestUpdated === 'card' ? card.updatedAt : updatedAt).toString()}
        wrapColumn={displayType !== 'table' ? true : props.wrapColumn}
        centerContent={displayType !== 'table'}
      />
    );
  } else if (propertyTemplate.type === 'tokenAmount') {
    const symbolOrAddress = card.fields.properties[REWARD_TOKEN] as string;
    const chainId = card.fields.properties[REWARD_CHAIN] as string;
    propertyValueElement = (
      <TokenAmount amount={displayValue as string} chainId={chainId} symbolOrAddress={symbolOrAddress} />
    );
  } else if (propertyTemplate.type === 'tokenChain') {
    // Note: we wat to display the token symbol, but it should not be part of 'display value' so we pass it in as a prop
    const symbolOrAddress = card.fields.properties[REWARD_TOKEN] as string;
    const chainId = card.fields.properties[REWARD_CHAIN] as string;
    propertyValueElement = <TokenChain chainId={chainId} symbolOrAddress={symbolOrAddress} />;
  } else if (propertyTemplate.id === REWARD_APPLICANTS_COUNT) {
    const totalApplicants = card.fields.properties[REWARD_APPLICANTS_COUNT];
    if (totalApplicants) {
      return (
        <Stack flexDirection='row' gap={1} className='octo-propertyvalue readonly'>
          <Box width={20} display='flex' alignItems='center'>
            <PersonIcon fontSize='small' />
          </Box>
          {totalApplicants}
        </Stack>
      );
    }
  }

  const commonProps = {
    className: 'octo-propertyvalue',
    placeholderText: emptyDisplayValue,
    readOnly: props.readOnly || proposalPropertyTypesList.includes(propertyTemplate.type as any),
    value: value.toString(),
    autoExpand: true,
    onChange: setValue,
    displayType,
    multiline: displayType === 'details' ? true : props.wrapColumn ?? false,
    onSave: async () => {
      try {
        await mutator.changePropertyValue(card, propertyTemplate.id, value);
      } catch (error) {
        showError(error);
      }
    },
    onCancel: () => setValue(propertyValue || ''),
    validator: (newValue: string) => validatePropertyValue(propertyTemplate.type, newValue),
    spellCheck: propertyTemplate.type === 'text',
    wrapColumn: props.wrapColumn ?? false,
    columnRef: props.columnRef
  };

  if (editableFields.includes(propertyTemplate.type)) {
    if (propertyTemplate.type === 'url') {
      propertyValueElement = <URLProperty {...commonProps} />;
    } else {
      propertyValueElement = (
        <TextInput
          {...commonProps}
          readOnly={readOnly || propertyTemplate.id === REWARDS_AVAILABLE_BLOCK_ID}
          displayType={propertyTemplate.id === REWARDS_AVAILABLE_BLOCK_ID ? 'details' : commonProps.displayType}
        />
      );
    }
  } else if (propertyTemplate.type === 'proposalUrl' && typeof displayValue === 'string') {
    const proposalUrl = getAbsolutePath(`/${propertyValue as string}`, domain);
    propertyValueElement = (
      <div data-test='property-proposal-url'>
        <URLProperty {...commonProps} value={proposalUrl} validator={() => true} />
      </div>
    );
  } else if (propertyValueElement === null) {
    propertyValueElement = (
      <div className={clsx('octo-propertyvalue', { readonly: readOnly })}>
        {displayValue || (showEmptyPlaceholder && <EmptyPlaceholder>{emptyDisplayValue}</EmptyPlaceholder>)}
      </div>
    );
  }

  const hasCardValue = ['createdBy', 'updatedBy', 'createdTime', 'updatedTime'].includes(propertyTemplate.type);
  const hasArrayValue = Array.isArray(value) && value.length > 0;
  const hasStringValue = !Array.isArray(value) && !!value;
  const hasValue = hasCardValue || hasArrayValue || hasStringValue;

  if (!hasValue && props.readOnly && displayType !== 'details') {
    return typeof subRowsEmptyValueContent === 'string' ? (
      <span>{subRowsEmptyValueContent}</span>
    ) : (
      subRowsEmptyValueContent ?? null
    );
  }

  if (props.showTooltip) {
    return (
      <Tooltip title={props.propertyTemplate.name}>
        <div style={{ width: '100%' }}>{propertyValueElement}</div>
      </Tooltip>
    );
  }

  return propertyValueElement;
}

export default memo(PropertyValueElement);
