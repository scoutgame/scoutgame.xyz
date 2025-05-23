import { log } from '@charmverse/core/log';
import { VerifyEmailPage } from '@packages/scoutgame-ui/components/verify-email/VerifyEmailPage';
import { verifyEmail } from '@packages/users/verifyEmail';

export default async function VerifyEmail({ searchParams }: { searchParams: Promise<{ code: string }> }) {
  const searchParamsResolved = await searchParams;
  let result: 'verified' | 'failed' | 'already_verified' = 'failed';
  try {
    const _result = await verifyEmail(searchParamsResolved.code);
    result = _result.result;
  } catch (error) {
    log.error('Error verifying email', { error, code: searchParamsResolved.code });
    result = 'failed';
  }
  return <VerifyEmailPage result={result} />;
}
