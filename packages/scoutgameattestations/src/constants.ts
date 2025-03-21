import env from '@beam-australia/react-env';
import { getPlatform } from '@packages/utils/platform';
import { baseSepolia, optimism } from 'viem/chains';

export const scoutGameAttestationChain = getPlatform() === 'onchain_webapp' ? optimism : baseSepolia;

export const scoutGameAttestationChainId = scoutGameAttestationChain.id;

export const SCOUTGAME_METADATA_PATH_PREFIX = process.env.SCOUTGAME_METADATA_PATH_PREFIX || 'dev';

/**
 * See attestations on https://optimism.easscan.org/schema/view/0x90a9d88d59bf8a6ff8371f9570111ae634caa46c016f7205a94f40a1c70fa4e9
 */
export const transactionInfoAttestationSchemaUid = '0x90a9d88d59bf8a6ff8371f9570111ae634caa46c016f7205a94f40a1c70fa4e9';

// Demo value -- base-sepolia.easscan.org/schema/view/0x5c99a66fb3581cca6e7a53f3e135db2245cdbb612a0846efc802cd4e9cd23818
export function scoutGameUserProfileSchemaUid() {
  return (env('SCOUTPROTOCOL_PROFILE_EAS_SCHEMAID') ||
    process.env.REACT_APP_SCOUTPROTOCOL_PROFILE_EAS_SCHEMAID) as `0x${string}`;
}

// Demo value -- base-sepolia.easscan.org/schema/view/0x99dd83daa6a4f2e818641185dfd3b8c9684838802a682bcdbd88de774f7acbae
export function scoutGameContributionReceiptSchemaUid() {
  return (env('SCOUTPROTOCOL_CONTRIBUTION_RECEIPT_EAS_SCHEMAID') ||
    process.env.REACT_APP_SCOUTPROTOCOL_CONTRIBUTION_RECEIPT_EAS_SCHEMAID) as `0x${string}`;
}

export function scoutGameBuilderEventSchemaUid() {
  return (env('SCOUTPROTOCOL_BUILDER_EVENT_EAS_SCHEMAID') ||
    process.env.REACT_APP_SCOUTPROTOCOL_BUILDER_EVENT_EAS_SCHEMAID) as `0x${string}`;
}
