import type { PageMeta } from '@charmverse/core/pages';
import type { ApiPageKey } from '@charmverse/core/prisma';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Grid, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { BsFiletypeCsv } from 'react-icons/bs';
import { RiGoogleFill } from 'react-icons/ri';
import { SiTypeform } from 'react-icons/si';
import { TbDatabase } from 'react-icons/tb';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import ConfirmApiPageKeyModal from 'components/common/Modal/ConfirmApiPageKeyModal';
import { webhookEndpoint } from 'config/constants';
import type { Board, DataSourceType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import { SidebarHeader } from '../viewSidebar';

import { GoogleFormsSource } from './components/GoogleForms/GoogleFormsSource';
import type { DatabaseSourceProps } from './components/LinkCharmVerseDatabase';
import { LinkCharmVerseDatabase } from './components/LinkCharmVerseDatabase';
import type { NewDatabaseSourceProps } from './components/NewCharmVerseDatabase';
import { NewCharmVerseDatabase } from './components/NewCharmVerseDatabase';
import { SourceType } from './components/viewSourceType';

type FormStep = 'select_source' | 'configure_source';

type ViewSourceOptionsProps = DatabaseSourceProps &
  Partial<NewDatabaseSourceProps> & {
    closeSidebar?: () => void;
    onCsvImport?: (event: ChangeEvent<HTMLInputElement>) => void;
    goBack?: () => void;
    title?: string;
    view?: BoardView;
    views: BoardView[];
    pageId?: string;
    page?: PageMeta;
    board?: Board;
  };

export function ViewSourceOptions(props: ViewSourceOptionsProps) {
  const {
    view: activeView,
    pageId,
    board,
    views,
    page,
    title,
    onCreateDatabase,
    onSelect,
    onCsvImport,
    goBack,
    closeSidebar
  } = props;

  console.log({ goBack });

  const activeSourceType = board?.fields.sourceType ?? activeView?.fields.sourceType;

  const [sourceType, setSourceType] = useState<DataSourceType | undefined>(activeSourceType);
  const [formStep, setStep] = useState<FormStep>(
    !onCreateDatabase || activeSourceType === 'google_form' ? 'configure_source' : 'select_source'
  );

  const {
    data: webhookApi,
    trigger: createWebhookApiKey,
    isMutating: isLoadingWebhookApiKeyCreation
  } = useSWRMutation(
    `/api/api-page-key`,
    (_url, { arg }: Readonly<{ arg: { pageId: string; type: ApiPageKey['type'] } }>) =>
      charmClient.createApiPageKey(arg)
  );

  const { trigger: createProposalSource, isMutating: isLoadingProposalSource } = useSWRMutation(
    `/api/pages/${pageId}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string } }>) => charmClient.createProposalSource(arg)
  );

  const typeformPopup = usePopupState({ variant: 'popover', popupId: 'typeformPopup' });

  async function handleApiKeyClick(type: ApiPageKey['type']) {
    if (pageId) {
      await createWebhookApiKey({ pageId, type });
      typeformPopup.open();
    }
  }

  async function handleProposalSource() {
    if (pageId && onCreateDatabase) {
      await onCreateDatabase?.({ sourceType: 'proposals' });
      await createProposalSource({ pageId });
    }
  }

  function selectSourceType(_source: DataSourceType) {
    return () => {
      setSourceType(_source);
      setStep('configure_source');
    };
  }

  function goToFirstStep() {
    setStep('select_source');
  }

  const isLinkedPage = String(page?.type).match('linked');

  console.log({ isLinkedPage });

  const goBackFunction = (isLinkedPage && views.length === 0) || formStep === 'select_source' ? goBack : goToFirstStep;

  return (
    <>
      <SidebarHeader goBack={goBackFunction} title={title} closeSidebar={closeSidebar} />
      <Box onClick={(e) => e.stopPropagation()}>
        {formStep === 'select_source' && (
          <Grid container spacing={1} px={1}>
            <SourceType active={activeSourceType === 'board_page'} onClick={selectSourceType('board_page')}>
              <TbDatabase style={{ fontSize: 24 }} />
              CharmVerse database
            </SourceType>
            {onCreateDatabase && (
              <>
                <SourceType
                  active={activeSourceType === 'proposals'}
                  onClick={
                    isLoadingProposalSource
                      ? undefined
                      : () => {
                          selectSourceType('proposals');
                          handleProposalSource();
                        }
                  }
                >
                  <TaskOutlinedIcon fontSize='small' />
                  Charmverse Proposals
                </SourceType>
                <SourceType active={false} component='label' htmlFor='dbcsvfile'>
                  <input hidden type='file' id='dbcsvfile' name='dbcsvfile' accept='.csv' onChange={onCsvImport} />
                  <BsFiletypeCsv style={{ fontSize: 24 }} />
                  Import CSV
                </SourceType>
                <SourceType active={activeSourceType === 'google_form'} onClick={selectSourceType('google_form')}>
                  <RiGoogleFill style={{ fontSize: 24 }} />
                  Google Form
                </SourceType>
                <SourceType
                  active={false}
                  onClick={() => (isLoadingWebhookApiKeyCreation ? {} : handleApiKeyClick('typeform'))}
                >
                  <SiTypeform style={{ fontSize: 24 }} />
                  Typeform
                </SourceType>
                <SourceType onClick={onCreateDatabase}>
                  <AddCircleIcon style={{ fontSize: 24 }} />
                  New database
                </SourceType>
              </>
            )}
          </Grid>
        )}
        {formStep === 'configure_source' && sourceType === 'board_page' && (
          <>
            <LinkCharmVerseDatabase onSelect={onSelect} activePageId={activeView?.fields.linkedSourceId} />
            {onCreateDatabase && <NewCharmVerseDatabase onCreateDatabase={onCreateDatabase} />}
          </>
        )}
        {formStep === 'configure_source' && sourceType === 'google_form' && (
          <GoogleFormsSource
            activeFormId={activeView?.fields.sourceData?.formId}
            activeCredential={activeView?.fields.sourceData?.credentialId}
            onSelect={onSelect}
          />
        )}
      </Box>
      <ConfirmApiPageKeyModal
        question={
          <Typography sx={{ wordBreak: 'break-word' }}>
            Go to your typeform form and click Connect - Webhooks - Add a Webhook
            <br />
            Paste the following URL:
            <br />
            <i>{`${window.location.origin}/${webhookEndpoint}/${webhookApi?.apiKey}`}</i>
          </Typography>
        }
        title='Typeform webhook'
        open={typeformPopup.isOpen}
        onClose={typeformPopup.close}
        onConfirm={() => {
          onCreateDatabase?.({ sourceType: 'board_page' });
          typeformPopup.close();
        }}
      />
    </>
  );
}
