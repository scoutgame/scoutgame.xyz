import type { ScoutPartner } from '@charmverse/core/prisma-client';
import { parseUnits } from 'viem';

export function getPartnerRewardAmount({
  scoutPartner,
  tags
}: {
  tags: string[] | null;
  scoutPartner: ScoutPartner;
}): bigint {
  if (!scoutPartner.tokenDecimals) {
    throw new Error('Scout partner token decimals is not set');
  }

  const issueTagTokenAmounts = scoutPartner.issueTagTokenAmounts as { tag: string; amount: number }[];
  if (issueTagTokenAmounts.length === 0 && scoutPartner.tokenAmountPerPullRequest) {
    return parseUnits(scoutPartner.tokenAmountPerPullRequest.toString(), scoutPartner.tokenDecimals);
  }

  if (!tags) {
    const defaultTag = issueTagTokenAmounts[0];
    return parseUnits(defaultTag.amount.toString(), scoutPartner.tokenDecimals);
  }

  let rewardAmount = parseUnits('0', scoutPartner.tokenDecimals);
  const matchingTagTokenAmount = issueTagTokenAmounts.find((issueTagTokenAmount) =>
    tags.includes(issueTagTokenAmount.tag)
  );
  if (matchingTagTokenAmount) {
    rewardAmount = parseUnits(matchingTagTokenAmount.amount.toString(), scoutPartner.tokenDecimals);
  }
  return rewardAmount;
}
