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

export function TransactionIcon({ size = 20 }: { size?: number }) {
  return <Image width={size} height={size} src='/images/icons/transaction.svg' alt='' />;
}
