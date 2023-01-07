import { GaxiosError } from 'gaxios';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getCredentialToken, invalidateCredential } from 'lib/google/authorization/credentials';
// import type { GoogleForm } from 'lib/google/forms/forms';
import { getForms } from 'lib/google/forms/getForms';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { InvalidInputError } from 'lib/utilities/errors/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

export type GetFormsRequest = {
  credentialId: string;
};

export type GoogleFormItem = {
  id: string;
  name: string;
  url: string;
};

handler.use(requireUser).get(getFormsResponse);

async function getFormsResponse(req: NextApiRequest, res: NextApiResponse) {
  const credentialId = req.query.credentialId;

  if (typeof credentialId !== 'string') {
    throw new InvalidInputError('Credential id is required');
  }

  try {
    const refreshToken = await getCredentialToken({ credentialId });
    const { files } = await getForms(refreshToken);

    const result = (files ?? []).map(
      (form): GoogleFormItem => ({
        id: form.id as string,
        name: form.name ?? 'Untitled',
        url: `https://docs.google.com/forms/d/${form.id}`
      })
    );

    res.send(result);
  } catch (error) {
    if (error instanceof GaxiosError) {
      if (error.response?.data.error === 'invalid_grant') {
        await invalidateCredential({ credentialId, error: error.response.data.error });
        throw new UnauthorisedActionError('Invalid credentials');
      }
    }
    throw error;
  }
}

export default withSessionRoute(handler);
