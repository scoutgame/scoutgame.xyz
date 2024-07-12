import { log } from '@charmverse/core/log';
import { SchemaRegistry, getSchemaUID } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from 'connectors/chains';
import { optimism, optimismSepolia } from 'viem/chains';

import type { EasSchemaChain } from '../connectors';
import { easSchemaChains, getEasConnector, getOnChainSchemaUrl } from '../connectors';
import { NULL_ADDRESS } from '../constants';
import { getCharmverseSigner } from '../getCharmverseSigner';

import { charmQualifyingEventSchemaDefinition } from './charmQualifyingEvent';
import { charmUserIdentifierSchemaDefinition } from './charmUserIdentifier';
import { externalCredentialSchemaDefinition } from './external';

import { allSchemaDefinitions } from './index';

async function deploySchema({
  schema,
  chainId,
  resolver = NULL_ADDRESS
}: {
  schema: string;
  chainId: EasSchemaChain;
  resolver?: string;
}) {
  const connector = getEasConnector(chainId);

  const schemaRegistry = new SchemaRegistry(connector.schemaRegistryContract);

  const signer = getCharmverseSigner({ chainId });

  const signerAddress = await signer.getAddress();

  // if (signerAddress !== '0x8Bc704386DCE0C4f004194684AdC44Edf6e85f07') {
  //   throw new Error('Schema must be deployed with CharmVerse Credentials Wallet');
  // }

  const fullChainName = `${getChainById(chainId)?.chainName} - ${chainId}`;

  schemaRegistry.connect(signer);

  // SchemaUID is deterministic
  const schemaUid = getSchemaUID(schema, resolver, true);

  const deployedSchema = await schemaRegistry.getSchema({ uid: schemaUid }).catch((err) => {
    log.info(`Schema not found on ${fullChainName}`);
  });

  const schemaUrl = getOnChainSchemaUrl({ chainId, schema: schemaUid });

  if (deployedSchema) {
    log.info(`Schema already exists at ${schemaUrl}`);
  } else {
    log.info('Creating schema');

    await schemaRegistry.register({
      schema,
      resolverAddress: resolver,
      revocable: true
    });

    log.info(`Schema ${schema} deployed at ${schemaUrl}`);
  }
}

// Used when we want to add a new schema to schemas we support
// Make sure schema is also included in allSupportedSchemas in lib/credentials/schemas/index.ts
async function deploySchemaAcrossChains({ schema }: { schema: string }) {
  for (const chainId of easSchemaChains) {
    log.info(`Deploying schema...`);
    await deploySchema({ schema, chainId });
  }
}

// Used when we want to add a new schema to schemas we support
// lib/credentials/schemas/index.ts
async function deploySchemasOnNewChain({ chainId }: { chainId: EasSchemaChain }) {
  for (const schema of allSchemaDefinitions) {
    log.info(`Deploying schema...`);
    await deploySchema({ schema, chainId });
  }
}

// deploySchemaAcrossChains({
//   schema: externalCredentialSchemaDefinition
// }).then(log.info);

// log.info(
//   getOnChainSchemaUrl({
//     chainId: optimism.id,
//     schema: externalCredentialSchemaDefinition
//   })
// );

// deploySchema({
//   chainId: optimismSepolia.id,
//   schema: charmUserIdentifierSchemaDefinition,
//   resolver: '0xda8793f28080ac2473032dc50497b93de0c1c67b'
// }).then(console.log);

// deploySchema({
//   chainId: optimismSepolia.id,
//   schema: charmQualifyingEventSchemaDefinition,
//   resolver: '0xda8793f28080ac2473032dc50497b93de0c1c67b'
// }).then(console.log);
