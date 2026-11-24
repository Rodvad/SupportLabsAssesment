import { request } from '@playwright/test';
import { BASE_URL } from './playwright.config';

/**
 * Fails fast with one clear message when the public practice site is down,
 * so an outage is not reported as nine separate test failures.
 */
export default async function globalSetup(): Promise<void> {
  const context = await request.newContext({ baseURL: BASE_URL });
  const attempts = 3;
  let lastProblem = '';

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await context.get('/api/room', { timeout: 15_000 });
      if (response.ok()) {
        await context.dispose();
        return;
      }
      lastProblem = `HTTP ${response.status()}`;
    } catch (error) {
      lastProblem = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  await context.dispose();
  throw new Error(
    `${BASE_URL} is not available (${lastProblem}) after ${attempts} attempts. ` +
      'It is a public practice site and it is sometimes down: please run the tests again later.',
  );
}
