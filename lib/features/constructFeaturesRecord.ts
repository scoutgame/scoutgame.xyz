import { sortArrayByObjectProperty } from 'lib/utilities/array';

import type { FeatureJson, MappedFeatures } from './constants';
import { STATIC_PAGES } from './constants';

export function constructFeaturesRecord(features: FeatureJson[]) {
  const dbFeatures = Object.fromEntries(features.map((_feat) => [_feat.id, _feat]));

  const sortedFeatures = sortArrayByObjectProperty(
    STATIC_PAGES,
    'feature',
    features.map((feat) => feat.id)
  );

  const extendedFeatures = sortedFeatures.map(({ feature, ...restFeat }) => ({
    ...restFeat,
    id: feature,
    isHidden: !!dbFeatures[feature]?.isHidden,
    title: dbFeatures[feature]?.title || restFeat.title
  }));

  const mappedFeatures = extendedFeatures.reduce((acc, val) => {
    acc[val.id] = val;
    return acc;
  }, {} as MappedFeatures);

  return {
    features: extendedFeatures,
    mappedFeatures
  };
}
