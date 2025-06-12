import puppeteer from 'puppeteer';
import { log } from '@charmverse/core/log';

// Leaving this package in case we want to use it in the future
// copied from https://github.com/Tammilore/substack-subscriber/tree/main

export function formatSubstackUrl(url: string) {
  // Ensure the URL starts with "https://"
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Remove any trailing slashes
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return url;
}

export async function subscribe(email: string, substackUrl: string) {
  if (!email) throw new Error('Email is required.');
  if (!substackUrl) throw new Error('Substack link is required.');

  const formattedSubstackUrl = formatSubstackUrl(substackUrl);
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 250, // Add a delay for realism (optional)
    args: [
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();
  const pageUrl = `${formattedSubstackUrl}/subscribe`;

  try {
    log.debug('Navigating to Substack...');
    await page.goto(pageUrl, {
      // waitUntil: 'networkidle',
      timeout: 80000 // 80 seconds timeout
    });

    log.debug('Page loaded, waiting for readiness...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Pause to allow all elements to load

    const requestBody = {
      first_url: pageUrl,
      first_referrer: '',
      current_url: pageUrl,
      current_referrer: '',
      first_session_url: pageUrl,
      first_session_referrer: '',
      referral_code: '',
      source: 'subscribe_page',
      referring_pub_id: '',
      additional_referring_pub_ids: '',
      email: email
    };

    const apiResponse = await page.evaluate(
      async ({ requestBody, formattedSubstackUrl }) => {
        try {
          const response = await fetch(`${formattedSubstackUrl}/api/v1/free`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const data = await response.json();
            return data;
          } else {
            const errorText = await response.text();
            return {
              error: `Error ${response.status}`,
              details: errorText
            };
          }
        } catch (error) {
          return {
            error: (error as Error).message,
            type: (error as Error).name
          };
        }
      },
      { requestBody, formattedSubstackUrl }
    );

    return apiResponse;
  } finally {
    await browser.close();
  }
}
