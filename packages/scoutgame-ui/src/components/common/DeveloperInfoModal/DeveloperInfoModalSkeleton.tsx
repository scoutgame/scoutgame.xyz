import { Skeleton, Stack } from '@mui/material';

export function DeveloperInfoModalSkeleton() {
  return (
    <Stack
      gap={{
        xs: 1,
        md: 2
      }}
    >
      <Stack
        direction='row'
        gap={{
          xs: 1,
          md: 2
        }}
      >
        <Skeleton
          variant='circular'
          sx={{
            width: {
              xs: 75,
              md: 100
            },
            height: {
              xs: 75,
              md: 100
            }
          }}
        />
        <Stack
          gap={{
            xs: 1,
            md: 2
          }}
        >
          <Skeleton variant='text' width={150} height={25} />
          <Skeleton variant='text' width={50} height={15} />
          <Stack
            direction='row'
            gap={{
              xs: 1,
              md: 2
            }}
          >
            <Stack direction='row' gap={1}>
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='text' width={100} height={20} />
            </Stack>
            <Stack direction='row' gap={1}>
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='text' width={100} height={20} />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Stack gap={0.5}>
        <Stack direction='row' gap={0.5}>
          <Skeleton
            variant='text'
            sx={{
              width: {
                xs: '33.33%',
                md: 150
              }
            }}
            height={125}
          />

          <Skeleton
            variant='text'
            sx={{
              width: {
                xs: '33.33%',
                md: 'calc(100% - 300px)'
              }
            }}
            height={125}
          />
          <Skeleton
            variant='text'
            sx={{
              width: {
                xs: '33.33%',
                md: 150
              }
            }}
            height={125}
          />
        </Stack>
        <Skeleton variant='text' width='100%' height={125} />
        <Stack
          direction={{
            xs: 'column',
            md: 'row'
          }}
          gap={0.5}
        >
          <Skeleton
            variant='text'
            sx={{
              width: {
                xs: '100%',
                md: '50%'
              }
            }}
            height={75}
          />
          <Skeleton
            variant='text'
            sx={{
              width: {
                xs: '100%',
                md: '50%'
              }
            }}
            height={75}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
