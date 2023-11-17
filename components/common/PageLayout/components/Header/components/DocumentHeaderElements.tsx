import type { PageType } from '@charmverse/core/prisma';
import { IconButton } from '@mui/material';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/DocumentSidebar';
import { documentTypes } from 'components/common/PageActions/components/DocumentPageActionList';
import { usePageSidebar } from 'hooks/usePageSidebar';

import { DocumentParticipants } from './DocumentParticipants';
import EditingModeToggle from './EditingModeToggle';
import { ShareButton } from './ShareButton/ShareButton';

type Props = {
  headerHeight: number;
  page: {
    deletedAt?: string | Date | null;
    id: string;
    type: string;
  };
};

export function DocumentHeaderElements({ headerHeight, page }: Props) {
  const { deletedAt, id, type } = page;
  const { activeView, setActiveView } = usePageSidebar();
  const isBasePageDocument = documentTypes.includes(type as PageType);
  return (
    <>
      {isBasePageDocument && <DocumentParticipants />}
      {isBasePageDocument && <EditingModeToggle />}
      {!deletedAt && <ShareButton headerHeight={headerHeight} pageId={id} />}
      {!deletedAt && (
        <IconButton onClick={() => setActiveView('proposal_evaluation')}>
          {SIDEBAR_VIEWS.proposal_evaluation.icon}
        </IconButton>
      )}
    </>
  );
}
