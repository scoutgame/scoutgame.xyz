import { parseUnits } from 'viem';

const gooddollarTokenDecimals = 18;

const goodDollarGithubTagsRewardRecord = {
  'Scouts Game - Common': parseUnits('500000', gooddollarTokenDecimals),
  'Scouts Game - Rare': parseUnits('1500000', gooddollarTokenDecimals),
  'Scouts Game - Epic': parseUnits('2500000', gooddollarTokenDecimals),
  'Scouts Game - Mythic': parseUnits('3500000', gooddollarTokenDecimals),
  'Scouts Game - Legendary': parseUnits('4500000', gooddollarTokenDecimals)
};

const defaultGithubTag = 'Scouts Game - Common';

export function getGooddollarPartnerRewardAmount(tags: string[] | null): bigint {
  if (!tags) {
    return goodDollarGithubTagsRewardRecord[defaultGithubTag];
  }

  let rewardAmount = parseUnits('0', gooddollarTokenDecimals);
  const matchingTag = tags.find((tag) => Object.keys(goodDollarGithubTagsRewardRecord).includes(tag));
  if (matchingTag) {
    rewardAmount = goodDollarGithubTagsRewardRecord[matchingTag as keyof typeof goodDollarGithubTagsRewardRecord];
  }
  return rewardAmount;
}
