import type { Theme } from '@emotion/react';
import { css } from '@emotion/react';

import { isTouchScreen } from 'lib/utilities/browser';

export const hoverIconsStyle = ({ absolutePositioning = false }: { absolutePositioning?: boolean } = {}) => ({ theme }: { theme: Theme }) => css`
  position: relative;
  
  &:hover .icons {
    opacity: 1;
    transition: ${theme.transitions.create('opacity', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.enteringScreen
  })}
  }

  & .icons {
    opacity: ${isTouchScreen() ? 1 : 0};
    transition: ${theme.transitions.create('opacity', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen
  })};
  ${absolutePositioning && `
    position: absolute;
    top: 0;
    right: 0;
    padding: ${theme.spacing(1)};
    margin: ${theme.spacing(1)};
    z-index: 1;
  `}
  }
`;
