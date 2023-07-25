import type { NodeViewProps } from '@bangle.dev/core';
import { Box } from '@mui/material';

import PopperPopup from 'components/common/PopperPopup';

import type { EmptyContentProps } from './EmptyEmbed';
import { EmptyEmbed } from './EmptyEmbed';
import { width } from './selectorPopupSizeConfig';

type InputProps = EmptyContentProps & {
  children: React.ReactNode;
  width?: any;
};

export function MediaSelectionPopup(props: InputProps & { node: NodeViewProps['node'] }) {
  const autoOpen = props.node.marks.some((mark) => mark.type.name === 'tooltip-marker');
  const sxWidth = props.width ?? width;

  return (
    <PopperPopup paperSx={{ width: sxWidth }} autoOpen={autoOpen} popupContent={<Box>{props.children}</Box>}>
      <EmptyEmbed {...props} />
    </PopperPopup>
  );
}

export function MediaSelectionPopupNoButton(props: InputProps & { open: boolean; onClose: VoidFunction }) {
  const sxWidth = props.width ?? width;

  return (
    <PopperPopup
      paperSx={{ width: sxWidth }}
      onClose={props.onClose}
      open={props.open}
      popupContent={<Box>{props.children}</Box>}
    />
  );
}
