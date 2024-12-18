import { LoginPage as LoginPageComponent } from '@packages/scoutgame-ui/components/login/LoginPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login to Scout Game'
};

export default async function LoginPage() {
  return <LoginPageComponent />;
}
