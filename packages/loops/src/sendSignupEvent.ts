import type { SignupEvent } from './client';
import { isEnabled, sendEvent } from './client';

// Create a user if one does not exist
export async function sendSignupEvent({ email }: { email: string }) {
  if (!isEnabled) {
    return { success: false };
  }
  const event: SignupEvent = {
    email,
    eventName: 'signup'
  };
  return sendEvent(event);
}
