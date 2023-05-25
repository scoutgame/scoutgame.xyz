import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { useEffect } from 'react';

import { isProdEnv, isStagingEnv } from 'config/constants';
import { useUser } from 'hooks/useUser';

const DD_SITE = 'datadoghq.com';
const DD_SERVICE = 'webapp-browser';

const env = isStagingEnv ? 'stg' : isProdEnv ? 'prd' : 'dev';

console.log({ token: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN, isProdEnv, isStagingEnv });

export default function useDatadogLogger() {
  const { user } = useUser();

  // Load DD_LOGS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN && (isProdEnv || isStagingEnv)) {
      datadogLogs.init({
        clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
        site: DD_SITE,
        service: DD_SERVICE,
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
        env,
        version: process.env.NEXT_PUBLIC_BUILD_ID
      });
    }
  }, []);

  // Load DD_RUM_LOGS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN && process.env.NEXT_PUBLIC_DD_RUM_APP_ID && isProdEnv) {
      datadogRum.init({
        applicationId: process.env.NEXT_PUBLIC_DD_RUM_APP_ID,
        clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
        site: DD_SITE,
        service: DD_SERVICE,
        sampleRate: 100,
        sessionReplaySampleRate: 20,
        trackInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
        env,
        version: process.env.NEXT_PUBLIC_BUILD_ID
      });

      datadogRum.startSessionReplayRecording();
    }

    return () => datadogRum.stopSessionReplayRecording();
  }, []);

  // Load the user id for DD_LOGS & DD_RUM_LOGS
  useEffect(() => {
    if (user && (isProdEnv || isStagingEnv)) {
      datadogLogs.onReady(() => {
        datadogLogs.setUser({ id: user.id });
      });
      datadogRum.onReady(() => {
        datadogRum.setUser({ id: user.id });
      });
    }

    return () => {
      datadogLogs.clearUser();
      datadogRum.clearUser();
    };
  }, [user?.id]);
}
