import styled from '@emotion/styled';
import type { MouseEvent } from 'react';

import { useGetOrCreateProposalNotesId } from 'charmClient/hooks/proposals';
import { StyledTypography } from 'components/common/CharmEditor/components/nestedPage/components/NestedPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageIcon } from 'components/common/PageIcon';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';

const StyledPageLink = styled.div`
  svg {
    font-size: 20px;
  }
`;

export function ProposalNotesLink({ pageId }: { pageId: string }) {
  const { showPage } = usePageDialog();
  const { showError } = useSnackbar();
  const { pages } = usePages();
  const syncedPageId = pages[pageId]?.syncWithPageId;

  const { trigger: getNotesPageId } = useGetOrCreateProposalNotesId();

  async function onClickInternalLink(e: MouseEvent) {
    try {
      const result = await getNotesPageId({ pageId: syncedPageId });
      if (result?.pageId) {
        showPage({ pageId: result.pageId });
        e.preventDefault();
      }
    } catch (error) {
      showError(error, 'Failed to load notes');
    }
  }

  return (
    <StyledPageLink onClick={onClickInternalLink}>
      <PageIcon pageType='page' />
      <StyledTypography variant='caption'>Reviewer Notes</StyledTypography>
    </StyledPageLink>
  );
}
