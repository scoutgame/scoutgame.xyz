import { transactionInfoAttestationSchemaUid } from '@packages/scoutgameattestations/constants';
import { POST } from '@packages/utils/http';
import { prefix0x } from '@packages/utils/prefix0x';
import { prettyPrint } from '@packages/utils/strings';

const gnosisSafeAddress = process.env.SCOUTGAME_GNOSIS_SAFE_ADDRESS as `0x${string}`;

type EASAttestationResponse = {
  attestations: {
    id: string;
    attester: string;
    data: string;
    decodedDataJson: string;
    timeCreated: string;
    txid: string;
  }[];
};

export async function getRevertedMintTransactionAttestations() {
  const EASSCAN_GRAPHQL_URL = 'https://optimism.easscan.org/graphql';

  const query = `
  query GetTransactionInfoAttestations($where: AttestationWhereInput!) {
    attestations(where: $where) {
      id
      attester
      data
      decodedDataJson
      timeCreated
      txid
    }
  }
`;

  const variables = {
    where: {
      attester: {
        equals: gnosisSafeAddress
      },
      schemaId: {
        equals: transactionInfoAttestationSchemaUid
      }
    }
  };

  const { data } = await POST<{ data: EASAttestationResponse }>(
    EASSCAN_GRAPHQL_URL,
    {
      query,
      variables
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return data.attestations.map((attestation) => {
    const transactionInfo = JSON.parse(attestation.decodedDataJson)[0].value.value as string;

    const parsedTransactionHashes = transactionInfo.match(/[a-fA-F0-9]{64}/g);

    return {
      uid: attestation.id,
      transactionHashesMap: (parsedTransactionHashes?.map((hash) => prefix0x(hash).toLowerCase()) ?? []).reduce(
        (acc, val) => {
          acc[val] = val;

          return acc;
        },
        {} as Record<string, string>
      )
    };
  });
}
