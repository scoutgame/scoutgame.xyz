import type { BuilderNftType } from '@charmverse/core/prisma';
import type { Address } from 'viem';

import type { PartialNftPurchaseEvent } from './getTokensCountForWeekWithNormalisation';

/**
 * scoutId -> nftType -> tokenId -> number of tokens
 */
export type NftOwnershipByTypeAndScout = Record<
  string,
  Record<Address, Record<BuilderNftType, Record<number, number>>>
>;

export function mapPurchaseEventsToOwnership(events: PartialNftPurchaseEvent[]): NftOwnershipByTypeAndScout {
  const ownership: NftOwnershipByTypeAndScout = {};

  for (const event of events) {
    // Initialize nested structure if needed
    const fromScoutId = event.from?.scoutId;
    const toScoutId = event.to?.scoutId;

    if (fromScoutId) {
      if (!ownership[fromScoutId]) {
        ownership[fromScoutId] = {};
      }

      if (!ownership[fromScoutId][event.from!.address as Address]) {
        ownership[fromScoutId][event.from!.address as Address] = {
          default: {},
          starter_pack: {}
        };
      }

      if (!ownership[fromScoutId][event.from!.address as Address][event.nftType]) {
        ownership[fromScoutId][event.from!.address as Address][event.nftType] = {};
      }

      const currentFromBalance =
        ownership[fromScoutId][event.from!.address as Address][event.nftType][event.tokenId] || 0;

      ownership[fromScoutId][event.from!.address as Address][event.nftType][event.tokenId] =
        currentFromBalance - event.tokensPurchased;
    }

    if (toScoutId) {
      if (!ownership[toScoutId]) {
        ownership[toScoutId] = {};
      }

      if (!ownership[toScoutId][event.to!.address as Address]) {
        ownership[toScoutId][event.to!.address as Address] = {
          default: {},
          starter_pack: {}
        };
      }

      if (!ownership[toScoutId][event.to!.address as Address][event.nftType]) {
        ownership[toScoutId][event.to!.address as Address][event.nftType] = {};
      }
      const currentToBalance = ownership[toScoutId][event.to!.address as Address][event.nftType][event.tokenId] || 0;
      ownership[toScoutId][event.to!.address as Address][event.nftType][event.tokenId] =
        currentToBalance + event.tokensPurchased;
    }
  }

  return ownership;
}
