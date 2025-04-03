import dynamic from 'next/dynamic';

// A time based component needs to be rendered only on the client since the server and client will not match
export const ReferenceTime = dynamic(
  () => import('./ReferenceTimeComponent').then((mod) => mod.ReferenceTimeComponent),
  {
    ssr: false,
    loading: () => <span>&nbsp;</span>
  }
);
