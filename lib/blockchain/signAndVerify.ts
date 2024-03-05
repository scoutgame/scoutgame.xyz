import { log } from '@charmverse/core/log';
import { SiweMessage } from 'lit-siwe';
import { hashMessage, parseAbi } from 'viem';

import { InvalidInputError } from '../utils/errors';

import { getPublicClient } from './publicClient';

/**
 * @domain - Domain prefixed with protocol ie. http://localhost:3000
 */
export type SignatureVerificationPayload = {
  message: SiweMessage;
  signature: `0x${string}`;
};

export async function getSiweFields({ message, signature, domain }: SignatureVerificationPayload & { domain: string }) {
  const siweMessage = new SiweMessage(message);
  const fields = await siweMessage.verify({ signature, domain });

  return fields;
}

/**
 * Use this for validating wallet signatures
 */
export async function isValidWalletSignature({
  message,
  signature,
  domain
}: SignatureVerificationPayload & { domain: string }): Promise<boolean> {
  if (!message || !signature || !domain) {
    throw new InvalidInputError('A wallet address, host and signature are required');
  }

  const fields = await getSiweFields({ message, signature, domain });

  if (fields.success) {
    return true;
  }

  if (fields.error) {
    log.error('Error validating wallet signature', { error: fields.error });
  }

  return false;
}

const EIP1271_MAGIC_VALUE = '0x1626ba7e';

const gnosisEipVerifyAbi = parseAbi([
  'function isValidSignature(bytes32 _messageHash, bytes _signature) public view returns (bytes4)'
]);

export async function verifyEIP1271Signature({
  message,
  signature,
  safeAddress
}: {
  message: string;
  signature: string;
  safeAddress: string;
}): Promise<boolean> {
  const chainId = parseInt(message.split('Chain ID:')[1]?.split('\n')[0]?.trim());

  const messageHash = hashMessage(message);

  const client = getPublicClient(chainId);

  const data = await client
    .readContract({
      address: safeAddress as any,
      account: safeAddress as any,
      abi: gnosisEipVerifyAbi,
      args: messageHash ? [messageHash, signature] : (null as any),
      functionName: 'isValidSignature'
    })
    .catch((err) => {
      // We might be trying to read a contract that does not exist
      return null;
    });

  return data === EIP1271_MAGIC_VALUE;
}
