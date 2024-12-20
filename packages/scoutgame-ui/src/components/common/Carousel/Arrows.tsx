import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { IconButtonProps } from '@mui/material';
import { IconButton } from '@mui/material';

const defaultSx: IconButtonProps['sx'] = {
  display: { xs: 'none', md: 'flex' },
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: '50%',
  width: '30px',
  height: {
    xs: '100px',
    md: '200px'
  },
  bgcolor: 'background.paper',
  transform: 'translate(0, -50%)',
  borderRadius: '5px',
  '&:hover': {
    bgcolor: 'background.paper'
  }
};

export function NextArrow({ sx, ...props }: IconButtonProps) {
  const combinedSx = { ...defaultSx, ...sx };
  return (
    <IconButton data-test='carousel-next-arrow' {...props} sx={{ right: '-10px', ...combinedSx }}>
      <ChevronRightIcon color='secondary' />
    </IconButton>
  );
}

export function PrevArrow({ sx, ...props }: IconButtonProps) {
  const combinedSx = { ...defaultSx, ...sx };
  return (
    <IconButton data-test='carousel-prev-arrow' {...props} sx={{ left: '-10px', ...combinedSx }}>
      <ChevronLeftIcon color='secondary' />
    </IconButton>
  );
}
