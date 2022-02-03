import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import ImageIcon from '@mui/icons-material/Image';
import { Box, ListItem, Typography } from '@mui/material';
import PopperPopup from 'components/common/PopperPopup';
import { HTMLAttributes, useState } from 'react';

const StyledImage = styled.div<{ align?: string }>`
  display: flex;
  justify-content: ${props => props.align};
`;

const Controls = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};

  display: flex;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 250ms ease-in-out;

  &:hover{
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }
`;

const ImageCaption = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.palette.text.primary};
  opacity: 0.5;
`;

const StyledEmptyImageContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyImageContainer (props: HTMLAttributes<HTMLDivElement>) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      sx={{
        backgroundColor: theme.palette.background.light,
        p: 2,
        display: 'flex',
        borderRadius: theme.spacing(0.5)
      }}
      {...props}
    >
      <StyledEmptyImageContainer>
        <ImageIcon fontSize='small' />
        <Typography>
          Add an image
        </Typography>
      </StyledEmptyImageContainer>
    </ListItem>
  );
}

export function Image ({ node, view }: NodeViewProps) {
  const [align, setAlign] = useState('center');
  const theme = useTheme();

  if (!node.attrs.src) {
    return (
      <PopperPopup popupContent={(
        <Box>
          Hello World
        </Box>
      )}
      >
        <EmptyImageContainer />
      </PopperPopup>
    );
  }
  return (
    <StyledImage align={align}>
      <div className='content' style={{ position: 'relative' }}>
        <Controls>
          {[
            [
              'start', <AlignHorizontalLeftIcon sx={{
                fontSize: 16
              }}
              />
            ], [
              'center', <AlignHorizontalCenterIcon sx={{
                fontSize: 16
              }}
              />
            ], [
              'end', <AlignHorizontalRightIcon
                sx={{
                  fontSize: 16
                }}
              />
            ]
          ].map(([alignLabel, alignIcon]) => (
            <ListItem
              key={alignLabel as string}
              sx={{
                padding: theme.spacing(1),
                backgroundColor: align === alignLabel ? theme.palette.background.dark : 'inherit'
              }}
              button
              disableRipple
              onClick={() => {
                setAlign(alignLabel as string);
              }}
            >
              {alignIcon}
            </ListItem>
          ))}
        </Controls>
        { /* eslint-disable-next-line */}
        {<img width={500} contentEditable={false} draggable src={node.attrs.src} alt={node.attrs.alt} />}
        <ImageCaption>
          {node.attrs.caption ?? 'Write a caption...'}
        </ImageCaption>
      </div>
    </StyledImage>
  );
}
