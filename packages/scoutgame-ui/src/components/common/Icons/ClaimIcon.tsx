import { SvgIcon } from '@mui/material';

export function ClaimIcon({ animate = false }: { animate?: boolean }) {
  return (
    <SvgIcon
      sx={{
        width: 25,
        height: 25,
        '@keyframes wiggle': {
          '0%': {
            transform: 'rotate(0deg)',
            scale: 1
          },
          '25%': {
            transform: 'rotate(-15deg)',
            scale: 1.2
          },
          '50%': {
            transform: 'rotate(0deg)',
            scale: 1
          },
          '75%': {
            transform: 'rotate(15deg)',
            scale: 1.2
          }
        },
        animation: animate ? 'wiggle 2s ease-in-out infinite' : 'none'
      }}
    >
      <svg width='25' height='24' viewBox='0 0 25 24' xmlns='http://www.w3.org/2000/svg'>
        <path
          d='M16.9949 7.33015C16.9949 6.90665 16.5731 6.79415 16.0381 6.65115C15.2824 6.4499 14.0179 6.11315 12.8479 4.9424C11.6274 3.7219 11.2866 2.09665 11.0826 1.12415C10.9454 0.471398 10.8626 0.0771484 10.4589 0.0771484C10.0549 0.0771484 9.97288 0.471398 9.83588 1.12415C9.63238 2.0959 9.29113 3.7219 8.07113 4.9424C6.90038 6.11315 5.63513 6.45065 4.87963 6.65115C4.34437 6.79415 3.92188 6.90665 3.92188 7.33015C3.92188 7.7534 4.34437 7.8659 4.87963 8.0089C5.63513 8.21015 6.90038 8.54765 8.07113 9.71765C9.29113 10.9381 9.63238 12.5641 9.83588 13.5359C9.97288 14.1889 10.0549 14.5821 10.4589 14.5821C10.8626 14.5821 10.9446 14.1889 11.0819 13.5359C11.2859 12.5641 11.6266 10.9381 12.8471 9.71765C14.0171 8.5469 15.2824 8.21015 16.0374 8.0089C16.5724 7.8659 16.9949 7.7534 16.9949 7.33015ZM12.3366 9.2064C11.1301 10.4121 10.6884 11.9696 10.4589 12.9956C10.2294 11.9696 9.78813 10.4121 8.58163 9.2064C7.31188 7.93665 5.97263 7.55215 5.13888 7.3294C5.97263 7.1064 7.31188 6.72265 8.58163 5.45215C9.78738 4.2464 10.2294 2.6889 10.4589 1.66365C10.6884 2.6889 11.1294 4.2464 12.3366 5.45215C13.6056 6.7219 14.9449 7.1064 15.7779 7.3294C14.9449 7.5529 13.6056 7.93665 12.3366 9.2064Z'
          fill='currentColor'
        />
        <mask
          id='mask0_1_14'
          style={{ maskType: 'luminance' }}
          maskUnits='userSpaceOnUse'
          x='0'
          y='14'
          width='10'
          height='10'
        >
          <path d='M0.875 14.3359H9.524V23.9359H0.875V14.3359Z' fill='white' />
        </mask>
        <g mask='url(#mask0_1_14)'>
          <path
            d='M8.79275 18.5904C8.32175 18.4652 7.534 18.2559 6.80825 17.5307C6.05475 16.7767 5.841 15.7602 5.71425 15.1529C5.62325 14.7207 5.55175 14.3794 5.1875 14.3794C4.8245 14.3794 4.753 14.7192 4.66275 15.1514C4.5355 15.7587 4.32375 16.7767 3.56875 17.5307C2.843 18.2559 2.0555 18.4652 1.5845 18.5904C1.235 18.6837 0.875 18.7797 0.875 19.1507C0.875 19.5219 1.235 19.6179 1.5845 19.7112C2.0555 19.8364 2.843 20.0457 3.56875 20.7709C4.32375 21.5257 4.5355 22.5437 4.66275 23.1502C4.753 23.5817 4.8245 23.9229 5.1875 23.9229C5.55175 23.9229 5.62325 23.5809 5.71425 23.1487C5.841 22.5414 6.05475 21.5242 6.80825 20.7709C7.534 20.0457 8.32175 19.8364 8.79275 19.7112C9.14225 19.6179 9.502 19.5219 9.502 19.1507C9.502 18.7797 9.14225 18.6837 8.79275 18.5904ZM6.297 20.2597C5.68 20.8767 5.36775 21.6264 5.18825 22.2449C5.00925 21.6264 4.697 20.8767 4.08 20.2597C3.443 19.6232 2.7625 19.3192 2.24775 19.1507C2.7625 18.9809 3.443 18.6777 4.08 18.0419C4.697 17.4249 5.00925 16.6752 5.18825 16.0567C5.36775 16.6752 5.68 17.4249 6.297 18.0419C6.9335 18.6784 7.6145 18.9817 8.1295 19.1507C7.6145 19.3199 6.93425 19.6232 6.297 20.2597Z'
            fill='currentColor'
          />
        </g>
        <path
          d='M23.3005 15.7437C22.6715 15.5747 21.6188 15.2945 20.6463 14.3227C19.6335 13.31 19.3488 11.9545 19.179 11.1445C19.0628 10.587 18.9853 10.2197 18.5993 10.2197C18.2133 10.2197 18.1365 10.5877 18.0203 11.1445C17.8503 11.9545 17.5663 13.31 16.5528 14.3227C15.5803 15.2952 14.5275 15.5755 13.8985 15.7437C13.444 15.8645 13.0513 15.969 13.0513 16.369C13.0513 16.7685 13.4433 16.8735 13.8978 16.9942C14.5275 17.1627 15.5803 17.443 16.5528 18.4152C17.5655 19.4272 17.8503 20.7842 18.0203 21.5935C18.1365 22.151 18.214 22.5192 18.5993 22.5192C18.986 22.5192 19.0628 22.151 19.179 21.5935C19.3488 20.7842 19.6328 19.428 20.6463 18.4152C21.6188 17.4422 22.6715 17.162 23.3013 16.9942C23.7553 16.8735 24.1478 16.7685 24.1478 16.369C24.147 15.969 23.7553 15.8645 23.3005 15.7437ZM20.1358 17.9042C19.2028 18.8365 18.8093 20.013 18.5993 20.8707C18.3898 20.013 17.9963 18.8365 17.0633 17.9042C16.0908 16.931 15.0373 16.562 14.3508 16.3682C15.0588 16.1692 16.0848 15.8117 17.0633 14.8325C17.9963 13.8995 18.389 12.7227 18.5993 11.865C18.8085 12.7227 19.2028 13.8995 20.1358 14.8325C21.1143 15.811 22.1388 16.1692 22.8483 16.3682C22.162 16.5627 21.1075 16.9317 20.1358 17.9042Z'
          fill='currentColor'
        />
      </svg>
    </SvgIcon>
  );
}
