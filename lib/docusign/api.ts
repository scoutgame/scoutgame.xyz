/**
 * Below methods are the API reference links for the Docusign API
 */

import { prisma } from '@charmverse/core/prisma-client';

import { GET, POST } from 'adapters/http';
import { baseUrl } from 'config/constants';
import { InvalidStateError } from 'lib/middleware';
import { prettyPrint } from 'lib/utils/strings';

import { docusignUserOAuthTokenHeader, getSpaceDocusignCredentials } from './authentication';

type DocusignApiRequest = {
  authToken: string;
  apiBaseUrl: string;
};

export type DocusignTemplate = {
  templateId: string;
  uri: string;
  name: string;
  shared: boolean;
  passwordProtected: boolean;
  description: string;
  created: string;
  lastModified: string;
  lastUsed: string;
  owner: {
    userName: string;
    userId: string;
    email: string;
  };
  pageCount: number;
  folderId: string;
  folderName: string;
  folderIds: string[];
  autoMatch: boolean;
  autoMatchSpecifiedByUser: boolean;
  emailSubject: string;
  emailBlurb: string;
  signingLocation: string;
  authoritativeCopy: boolean;
  enforceSignerVisibility: boolean;
  enableWetSign: boolean;
  allowMarkup: boolean;
  allowReassign: boolean;
  disableResponsiveDocument: boolean;
  anySigner: any; // 'any' type can be replaced with more specific type if known
  envelopeLocation: any; // 'any' type can be replaced with more specific type if known
};

export function getDocusignTemplates({ apiBaseUrl, authToken, accountId }: DocusignApiRequest & { accountId: string }) {
  return GET<DocusignTemplate[]>(`${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/templates`, undefined, {
    headers: docusignUserOAuthTokenHeader({ accessToken: authToken })
  });
}

type DocumentSigner = {
  email: string;
  name: string;
  roleName?: string;
};

export type DocusignEnvelopeToCreate = {
  templateId: string;
  signers: DocumentSigner[];
};

export type CreatedEnvelope = {
  envelopeId: string;
  uri: string;
  statusDateTime: string;
  status: 'created';
};

export async function createEnvelope({
  apiBaseUrl,
  accountId,
  authToken,
  templateId,
  signers,
  spaceId
}: DocusignApiRequest & DocusignEnvelopeToCreate & { accountId: string; spaceId: string }): Promise<CreatedEnvelope> {
  const apiUrl = `${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/envelopes`;
  const result = (await POST(
    apiUrl,
    { templateId, templateRoles: signers, status: 'sent' },
    { headers: docusignUserOAuthTokenHeader({ accessToken: authToken }) }
  )) as CreatedEnvelope;

  await prisma.documentToSign.create({
    data: {
      docusignEnvelopeId: result.envelopeId,
      space: { connect: { id: spaceId } }
    }
  });

  return result as any;
}

type DocusignRecipient = {
  creationReason: string;
  isBulkRecipient: boolean;
  recipientSuppliesTabs: boolean;
  requireUploadSignature: boolean;
  name: string;
  email: string;
  recipientId: string;
  recipientIdGuid: string;
  requireIdLookup: boolean;
  userId: string;
  routingOrder: string;
  roleName: string;
  status: string;
  completedCount: string;
  sentDateTime: string;
  deliveryMethod: string;
  recipientType: string;
};

export type DocusignEnvelope = {
  status: string;
  documentsUri: string;
  recipientsUri: string;
  attachmentsUri: string;
  envelopeUri: string;
  emailSubject: string;
  envelopeId: string;
  signingLocation: string;
  customFieldsUri: string;
  notificationUri: string;
  enableWetSign: boolean;
  allowMarkup: boolean;
  allowReassign: boolean;
  createdDateTime: string;
  lastModifiedDateTime: string;
  initialSentDateTime: string;
  sentDateTime: string;
  statusChangedDateTime: string;
  documentsCombinedUri: string;
  certificateUri: string;
  templatesUri: string;
  expireEnabled: boolean;
  expireDateTime: string;
  expireAfter: string;
  sender: {
    userName: string;
    userId: string;
    accountId: string;
    email: string;
    ipAddress: string;
  };
  purgeState: string;
  envelopeIdStamping: boolean;
  is21CFRPart11: boolean;
  signerCanSignOnMobile: boolean;
  autoNavigation: boolean;
  isSignatureProviderEnvelope: boolean;
  hasFormDataChanged: boolean;
  allowComments: boolean;
  hasComments: boolean;
  allowViewHistory: boolean;
  envelopeMetadata: {
    allowAdvancedCorrect: boolean;
    enableSignWithNotary: boolean;
    allowCorrect: boolean;
  };
  anySigner: null;
  envelopeLocation: string;
  isDynamicEnvelope: boolean;
  burnDefaultTabData: boolean;
  recipients: { signers: DocusignRecipient[] };
};

async function getEnvelope({
  apiBaseUrl,
  authToken,
  accountId,
  envelopeId
}: DocusignApiRequest & { accountId: string; envelopeId: string }): Promise<DocusignEnvelope> {
  return GET<DocusignEnvelope>(
    `${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
    { include: 'recipients' },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: authToken })
    }
  );
}

export async function listSpaceEnvelopes({ spaceId }: { spaceId: string }): Promise<DocusignEnvelope[]> {
  const envelopes = await prisma.documentToSign.findMany({
    where: { spaceId }
  });

  const creds = await getSpaceDocusignCredentials({ spaceId });

  const envelopeData = await Promise.all(
    envelopes.map((e) =>
      getEnvelope({
        envelopeId: e.docusignEnvelopeId,
        accountId: creds.docusignAccountId,
        apiBaseUrl: creds.docusignApiBaseUrl,
        authToken: creds.accessToken
      })
    )
  );

  return envelopeData;
}

export async function createEnvelopeSigningLink({ envelopeId }: { envelopeId: string }): Promise<string> {
  const envelopeInDb = await prisma.documentToSign.findFirstOrThrow({
    where: {
      docusignEnvelopeId: envelopeId
    },
    include: {
      space: {
        select: {
          domain: true
        }
      }
    }
  });

  const spaceCreds = await getSpaceDocusignCredentials({ spaceId: envelopeInDb.spaceId });

  const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes/${envelopeId}/views/recipient`;

  const docusignEnvelope = await getEnvelope({
    accountId: spaceCreds.docusignAccountId,
    apiBaseUrl: spaceCreds.docusignApiBaseUrl,
    authToken: spaceCreds.accessToken,
    envelopeId
  });

  prettyPrint({ docusignEnvelope });

  const recipient = docusignEnvelope.recipients.signers.find((r) => r.roleName === 'signer');

  if (!recipient) {
    throw new InvalidStateError('No signer found for envelope');
  }

  const signerData = {
    returnUrl: `${baseUrl}/${envelopeInDb.space.domain}/sign-docs`,
    authenticationMethod: 'none',
    email: recipient.email,
    userName: recipient.name,
    clientUserId: parseInt(recipient.recipientId)
  };

  const url = (await POST<{ url: string }>(apiUrl, signerData, {
    headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
  })) as { url: string };

  return url.url;
}
