import { capitalize } from 'lodash';

import { isUUID } from 'lib/utilities/strings';

import type { MixpanelEventName, MixpanelTrackBase } from './interfaces';

// format event_name to Event name
export function eventNameToHumanFormat(eventName: MixpanelEventName) {
  return capitalize(eventName.toLowerCase().replaceAll('_', ' '));
}

export function stringToHumanFormat(str: string) {
  const stringWithSpaces = str.replace(/[A-Z]/g, (l) => ` ${l}`).trim();
  return stringWithSpaces.charAt(0).toUpperCase() + stringWithSpaces.slice(1);
}

export function paramsToHumanFormat(params: Record<string, any>) {
  const humanReadableParams: Record<string, any> = {};

  Object.keys(params).forEach((k) => {
    const updatedKey = stringToHumanFormat(k);
    humanReadableParams[updatedKey] = params[k];
  });

  return humanReadableParams;
}

export function validateMixPanelEvent(params: MixpanelTrackBase) {
  if (isUUID(params.distinct_id)) {
    return 'spaceId' in params && params.spaceId === 'string' ? isUUID(params.spaceId) : true;
  } else {
    return false;
  }
}
