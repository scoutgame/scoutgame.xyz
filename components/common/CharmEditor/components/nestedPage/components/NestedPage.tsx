import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { TextSelection } from '@bangle.dev/pm';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import LinkIcon from '@mui/icons-material/Link';
import { Box, Menu, MenuItem, Typography } from '@mui/material';
import ActionsMenu from 'components/common/ActionsMenu';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { PageContent } from 'models';
import Link from 'next/link';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { rafCommandExec } from '@bangle.dev/utils';
import { ReactNode } from 'react';

const NestedPageContainer = styled((props: any) => <div {...props} />)`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: 3px 3px 3px 2px;
  position: relative;
  transition: background 20ms ease-in 0s;
  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
  .actions-menu {
    opacity: 0;
  }
  &:hover .actions-menu {
    opacity: 1;
  }
`;

export default function NestedPage ({ node, getPos, view, readOnly }: NodeViewProps & {readOnly: boolean, children: ReactNode}) {
  const [space] = useCurrentSpace();
  const { pages } = usePages();
  const { showMessage } = useSnackbar();
  const nestedPage = pages[node.attrs.id];
  const popupState = usePopupState({ variant: 'popover', popupId: 'nested-page' });

  const isEditorEmpty = checkForEmpty(nestedPage?.content as PageContent);

  const fullPath = `${window.location.origin}/${space?.domain}/${nestedPage?.path}`;
  const bindMenuProps = bindMenu(popupState);
  return (
    <NestedPageContainer data-id={`page-${nestedPage?.id}`} data-title={nestedPage?.title} data-path={fullPath}>
      <div>
        {nestedPage && <PageIcon isEditorEmpty={isEditorEmpty} icon={nestedPage.icon} pageType={nestedPage.type} />}
      </div>
      {nestedPage ? (
        <Link
          href={`/${(space)?.domain}/${nestedPage?.path}`}
          passHref
        >
          <Box fontWeight={600} component='div' width='100%'>
            {nestedPage?.title || 'Untitled'}
          </Box>
        </Link>
      ) : (
        <Box fontWeight={600} component='div' width='100%'>
          Page not found
        </Box>
      )}

      {
        !readOnly && (
        <>
          <ActionsMenu {...bindTrigger(popupState)} />
          <Menu
            {...bindMenuProps}
          >
            <MenuItem
              sx={{ padding: '3px 12px' }}
              onClick={() => {
                const pos = getPos();
                view.dispatch(view.state.tr.setSelection(
                  TextSelection.create(view.state.doc, pos, pos + 1)
                ));
                view.dispatch(view.state.tr.deleteSelection());
                bindMenuProps.onClose();
              }}
            >
              <DeleteIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
            </MenuItem>
            <MenuItem
              sx={{ padding: '3px 12px' }}
              onClick={() => {
                const pos = getPos();
                rafCommandExec(view, (state, dispatch) => {
                  const nestedPageNode = state.schema.nodes.page.create({
                    id: nestedPage?.id
                  });
                  if (dispatch) {
                    dispatch(view.state.tr.insert(pos + 1, nestedPageNode));
                  }
                  return true;
                });
                bindMenuProps.onClose();
              }}
            >
              <ContentPasteIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Duplicate</Typography>
            </MenuItem>
            <MenuItem
              sx={{ padding: '3px 12px' }}
              onClick={() => {
                // eslint-disable-next-line
                navigator.clipboard.writeText(`${location.origin}/${space?.domain}/${nestedPage?.path}`);
                showMessage('Link copied');
                bindMenuProps.onClose();
              }}
            >
              <LinkIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Copy Link</Typography>
            </MenuItem>
          </Menu>
        </>
        )
      }
    </NestedPageContainer>
  );
}
