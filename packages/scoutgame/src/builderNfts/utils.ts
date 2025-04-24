import { formatUnits } from 'viem';

export function convertCostToUsdDisplay(cost: bigint, locale?: string) {
  return `$${parseFloat(formatUnits(cost, 6)).toLocaleString(locale)}`;
}

// 1 Point is $.10. So $1 is 10 points USDC
export function convertCostToPoints(costWei: bigint, builderTokenDecimals = 6) {
  const costInUsd = Number(formatUnits(costWei, builderTokenDecimals));
  return Math.floor(costInUsd * 10);
}
