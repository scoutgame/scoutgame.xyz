/**
 * Useful when working with onchain data and needed to prefix with 0x
 */
export function prefix0x(hex: string): `0x${string}` {
  return hex.startsWith('0x') ? (hex as `0x${string}`) : (`0x${hex}` as `0x${string}`);
}
