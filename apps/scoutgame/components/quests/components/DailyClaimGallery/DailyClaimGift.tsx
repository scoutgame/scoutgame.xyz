import { SvgIcon } from '@mui/material';

export function DailyClaimGift({
  variant = 'primary',
  size = 64
}: {
  variant: 'disabled' | 'primary' | 'secondary';
  size: number;
}) {
  const primaryColor = '#A06CD5';
  const secondaryColor = '#0580A4';
  const disabledColor = '#4D4D4D';

  const fillColor = variant === 'primary' ? primaryColor : variant === 'secondary' ? secondaryColor : disabledColor;

  return (
    <SvgIcon sx={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox='0 0 64 65' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_2977_2016)'>
          <path
            d='M29.1793 20.9914C27.3753 19.0734 25.1593 17.5647 22.706 16.6434C18.7546 15.1227 14.2013 15.2941 10.3706 17.0287L8.69531 12.6827C12.7066 11.3267 17.114 11.2241 21.1386 12.4674C25.0653 13.6647 28.5893 16.1454 31.0873 19.3874L29.1793 20.9914Z'
            fill={fillColor}
          />
          <path
            d='M31.8224 21.1272L29.5044 22.0425C29.437 21.8645 29.3657 21.6885 29.295 21.5119L29.455 21.2252C29.319 21.1252 29.1844 21.0239 29.049 20.9259C27.385 17.0585 24.9144 13.5619 21.5844 11.0432C20.171 10.0172 17.7184 8.47455 15.8924 8.77521L15.529 7.50188C15.299 6.69455 15.2317 5.85388 15.3244 5.02588C16.2144 5.04921 17.0937 5.28588 17.8997 5.56721C22.8304 7.30255 26.5217 11.4279 29.163 15.7759C30.1884 17.4772 31.0584 19.2945 31.8224 21.1272Z'
            fill={fillColor}
          />
          <path
            d='M29.2951 21.5122L28.2358 23.4009C24.0704 21.6796 17.0438 18.0976 13.3684 13.8489C12.9731 13.3569 12.6191 12.8569 12.3091 12.3489C12.2931 12.3222 12.2771 12.2976 12.2611 12.2709C11.8124 11.5242 11.4638 10.7636 11.2431 9.99222C11.0971 9.48289 10.9884 9.03022 10.9138 8.62289C10.8924 8.49422 10.8711 8.37156 10.8551 8.25222V8.25022C10.8284 8.05422 10.8104 7.87089 10.8018 7.69822C10.8058 7.62689 10.8124 7.55956 10.8211 7.49289C10.8498 7.27022 10.9018 7.07489 10.9764 6.90022C11.3871 5.92555 12.4784 5.63155 13.8931 5.19689C14.3651 5.05289 14.8471 5.01155 15.3244 5.02622C15.3044 5.20089 15.2924 5.37355 15.2871 5.54755C15.2818 5.75089 15.2851 5.95222 15.2978 6.15555C15.3158 6.42622 15.3491 6.69489 15.4011 6.96222C15.4344 7.14422 15.4778 7.32422 15.5291 7.50222L15.8924 8.77556C15.9971 9.03422 16.0898 9.28689 16.2764 9.62889C16.4098 9.85889 16.5544 10.0836 16.7071 10.3009C16.9478 10.6462 17.2078 10.9776 17.4871 11.3036C17.5244 11.3502 17.5651 11.3962 17.6044 11.4429C17.9124 11.7989 18.2418 12.1482 18.5798 12.4969C20.5111 14.4496 22.6591 16.1576 24.8791 17.8429C26.2424 18.8849 27.6484 19.8896 29.0491 20.9262C29.1344 21.1202 29.2144 21.3162 29.2951 21.5122Z'
            fill={fillColor}
          />
          <path
            d='M30.6367 19.494L32.7367 20.7786C32.8354 20.62 32.9361 20.464 33.0381 20.308L32.9327 20.0053C33.0827 19.934 33.2334 19.8606 33.3834 19.7906C35.7054 16.3853 38.7487 13.4773 42.4567 11.6553C44.0227 10.9233 46.6967 9.88064 48.4274 10.4906L49.0114 9.33664C49.3814 8.60531 49.5987 7.81331 49.6567 7.00464C48.7834 6.86997 47.8814 6.94131 47.0427 7.06864C41.9121 7.85797 37.5621 11.1526 34.1987 14.8453C32.8907 16.2913 31.7127 17.876 30.6367 19.494Z'
            fill={fillColor}
          />
          <path
            d='M52.5271 12.6002C52.2831 12.9709 51.9998 13.3362 51.6831 13.6929C47.8104 18.0549 38.8771 21.2322 33.7331 22.3016L33.0371 20.3089C33.1518 20.1342 33.2638 19.9616 33.3824 19.7909C34.9384 19.0469 36.4931 18.3342 38.0144 17.5775C40.4858 16.3575 42.8918 15.1029 45.1311 13.5749C45.7218 13.1635 46.2878 12.7502 46.8091 12.3022C47.1978 11.9715 47.5631 11.6189 47.8971 11.2389C48.1424 10.9449 48.2778 10.7189 48.4278 10.4909L49.0104 9.33755C49.3804 8.60488 49.5978 7.81355 49.6558 7.00488C50.1251 7.07488 52.2384 7.97155 52.6564 8.22088C54.2618 9.18155 53.7084 10.7995 52.5271 12.6002Z'
            fill={fillColor}
          />
          <path
            d='M30.0273 19.5891C31.842 17.9751 34.3007 15.0091 35.238 12.8498C36.7567 9.42511 36.8 5.50511 35.4127 2.25577L40.2527 0.502441C41.1787 4.10444 40.92 8.03378 39.4513 11.5958C38.05 15.0344 35.5073 18.1091 32.3633 20.2464L31.1867 19.9151L30.0273 19.5891Z'
            fill={fillColor}
          />
          <mask
            id='mask0_2977_2016'
            style={{ maskType: 'luminance' }}
            maskUnits='userSpaceOnUse'
            x='7'
            y='30'
            width='49'
            height='35'
          >
            <path d='M7.53223 30.7871H55.5922V64.4984H7.53223V30.7871Z' fill='white' />
          </mask>
          <g mask='url(#mask0_2977_2016)'>
            <path
              d='M55.5393 30.7993L55.5173 33.09L55.5093 34.0566L55.448 40.5207L55.402 45.4173L55.2953 56.562L55.2487 61.4587L55.18 64.4987H7.96933L7.89733 61.1853L7.85266 56.3787L7.74866 45.446L7.70266 40.6407L7.64133 34.0566L7.63199 33.09L7.61133 30.7993H55.5393Z'
              fill={fillColor}
            />
          </g>
          <mask
            id='mask1_2977_2016'
            style={{ maskType: 'luminance' }}
            maskUnits='userSpaceOnUse'
            x='7'
            y='34'
            width='49'
            height='31'
          >
            <path d='M7.6123 34.0269H55.5103V64.4989H7.6123V34.0269Z' fill='white' />
          </mask>
          <g mask='url(#mask1_2977_2016)'>
            <path
              d='M55.5093 34.0576L55.506 34.3236L55.5026 34.791L55.49 36.1216L55.4813 36.8163L55.4473 40.5223L55.4193 43.563L55.402 45.4176L55.324 53.6189L55.3186 54.103V54.1043L55.2953 56.3283L55.294 56.5623L55.2886 57.177L55.2693 59.3209L55.264 59.8316V59.8423L55.2473 61.4603L55.1786 64.499H7.96796L7.89729 61.1856L7.88463 59.8136L7.85063 56.3796L7.77463 48.2336L7.74796 45.4463L7.73263 43.6956L7.73063 43.595L7.70263 40.641L7.64729 34.7536L7.64062 34.0576H55.5093Z'
              fill={fillColor}
            />
          </g>
          <mask
            id='mask2_2977_2016'
            style={{ maskType: 'luminance' }}
            maskUnits='userSpaceOnUse'
            x='5'
            y='19'
            width='53'
            height='15'
          >
            <path d='M5.58984 19.0459H57.5578V33.0972H5.58984V19.0459Z' fill='white' />
          </mask>
          <g mask='url(#mask2_2977_2016)'>
            <path d='M57.5592 19.0952V33.0905H5.58984V19.0952H57.5592Z' fill={fillColor} />
          </g>
          <path d='M36.6583 33.0898V34.0572H26.4883V33.0898H36.6583Z' fill={fillColor} />
          <mask
            id='mask3_2977_2016'
            style={{ maskType: 'luminance' }}
            maskUnits='userSpaceOnUse'
            x='26'
            y='34'
            width='11'
            height='31'
          >
            <path d='M26.4648 34.0269H36.6595V64.4989H26.4648V34.0269Z' fill='white' />
          </mask>
          <g mask='url(#mask3_2977_2016)'>
            <path d='M36.6589 34.0576L36.5889 64.499H26.5596L26.4902 34.0576H36.6589Z' fill={fillColor} />
          </g>
          <path d='M37.0937 33.0909H26.0537V19.0942H37.0937V33.0909Z' fill={fillColor} />
          <mask
            id='mask4_2977_2016'
            style={{ maskType: 'luminance' }}
            maskUnits='userSpaceOnUse'
            x='7'
            y='59'
            width='6'
            height='6'
          >
            <path d='M7.85547 59.7759H12.3861V64.4985H7.85547V59.7759Z' fill='white' />
          </mask>
          <g mask='url(#mask4_2977_2016)'>
            <path
              d='M12.3574 64.24C12.3574 64.3267 12.3554 64.414 12.3501 64.4987H7.9681L7.89743 61.1853L7.88477 59.8133C7.90077 59.812 7.91677 59.812 7.93277 59.812C10.3761 59.812 12.3574 61.7947 12.3574 64.24Z'
              fill={fillColor}
            />
          </g>
          <path
            d='M24.5095 52.0771C24.5095 54.5224 22.5288 56.5051 20.0848 56.5051C17.6415 56.5051 15.6602 54.5224 15.6602 52.0771C15.6602 49.6311 17.6415 47.6484 20.0848 47.6484C22.5288 47.6484 24.5095 49.6311 24.5095 52.0771Z'
            fill={fillColor}
          />
          <path
            d='M12.3575 39.1712C12.3575 41.6165 10.3761 43.5998 7.93279 43.5998C7.86546 43.5998 7.79813 43.5978 7.73079 43.5945L7.70279 40.6405L7.64746 34.7532C7.74146 34.7465 7.83746 34.7432 7.93279 34.7432C10.3761 34.7432 12.3575 36.7258 12.3575 39.1712Z'
            fill={fillColor}
          />
          <path
            d='M24.5095 27.0086C24.5095 29.4539 22.5288 31.4366 20.0848 31.4366C17.6415 31.4366 15.6602 29.4539 15.6602 27.0086C15.6602 24.5632 17.6415 22.5806 20.0848 22.5806C22.5288 22.5806 24.5095 24.5632 24.5095 27.0086Z'
            fill={fillColor}
          />
          <path
            d='M48.2878 52.0771C48.2878 54.5224 46.3065 56.5051 43.8631 56.5051C41.4198 56.5051 39.4385 54.5224 39.4385 52.0771C39.4385 49.6311 41.4198 47.6484 43.8631 47.6484C46.3065 47.6484 48.2878 49.6311 48.2878 52.0771Z'
            fill={fillColor}
          />
          <path
            d='M48.2878 27.0086C48.2878 29.4539 46.3065 31.4366 43.8631 31.4366C41.4198 31.4366 39.4385 29.4539 39.4385 27.0086C39.4385 24.5632 41.4198 22.5806 43.8631 22.5806C46.3065 22.5806 48.2878 24.5632 48.2878 27.0086Z'
            fill={fillColor}
          />
          <mask
            id='mask5_2977_2016'
            style={{ maskType: 'luminance' }}
            maskUnits='userSpaceOnUse'
            x='50'
            y='59'
            width='6'
            height='6'
          >
            <path d='M50.4131 59.7759H55.2678V64.4985H50.4131V59.7759Z' fill='white' />
          </mask>
          <g mask='url(#mask5_2977_2016)'>
            <path
              d='M55.2633 59.8313V59.842L55.2467 61.46L55.178 64.4987H50.438C50.4327 64.414 50.4307 64.3267 50.4307 64.24C50.4307 61.7947 52.412 59.812 54.8553 59.812C54.994 59.812 55.13 59.8187 55.2633 59.8313Z'
              fill={fillColor}
            />
          </g>
          <path
            d='M55.503 34.7905L55.4903 36.1212L55.4816 36.8158L55.4476 40.5218L55.4196 43.5625C55.2356 43.5872 55.0476 43.5998 54.8563 43.5998C52.413 43.5998 50.4316 41.6165 50.4316 39.1712C50.4316 36.7258 52.413 34.7432 54.8563 34.7432C55.0763 34.7432 55.2923 34.7585 55.503 34.7905Z'
            fill={fillColor}
          />
        </g>
        <defs>
          <clipPath id='clip0_2977_2016'>
            <rect width='64' height='64' fill='white' transform='translate(0 0.5)' />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
