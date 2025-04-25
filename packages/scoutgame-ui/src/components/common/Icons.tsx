import Image from 'next/image';

const gemsSrc = {
  bronze: '/images/icons/gem-bronze.svg',
  silver: '/images/icons/gem-silver.svg',
  gold: '/images/icons/gem-gold.svg',
  default: '/images/icons/gem.svg'
} as const;

export function GemsIcon({ size = 20, color }: { size?: number; color?: 'bronze' | 'silver' | 'gold' }) {
  const src = (color && gemsSrc[color]) || gemsSrc.default;
  return <Image width={size} height={size} src={src} alt='' />;
}

const pointsSrc = {
  orange: '/images/icons/binoculars-orange.svg',
  green: '/images/icons/binoculars-green.svg',
  blue: '/images/icons/binoculars-blue.svg',
  inherit: '/images/icons/binoculars-inherit.svg',
  default: '/images/dev-token-logo.png'
} as const;

export function PointsIcon({ size = 20, color }: { size?: number; color?: 'orange' | 'green' | 'blue' | 'inherit' }) {
  const src = (color && pointsSrc[color]) || pointsSrc.default;
  return <Image width={size} height={size} src={src} alt='' style={{ fill: 'red !important' }} />;
}

export function TransactionIcon({ size = 20 }: { size?: number }) {
  return <Image width={size} height={size} src='/images/icons/transaction.svg' alt='' />;
}
