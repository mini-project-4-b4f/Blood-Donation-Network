import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { baseURL, json, startBrowser } from './helpers.mjs';

let runtime;
before(async () => { runtime = await startBrowser(); });
after(async () => { await runtime?.close(); });

test('browser: an unknown URL offers a keyboard-accessible return to the board', async () => {
  const page = await runtime.browser.newPage({ viewport: { width: 320, height: 800 } });
  try {
    await page.route('**/api/requests/sos', (route) => json(route, []));
    await page.goto(`${baseURL}/not-a-real-page`);
    await page.getByRole('heading', { name: 'This page took a different path.' }).waitFor();
    const link = page.getByRole('link', { name: 'Back to the SOS board' });
    await link.focus();
    assert.equal(await link.evaluate((element) => element === document.activeElement), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.keyboard.press('Enter');
    await page.waitForURL(`${baseURL}/`);
    await page.getByRole('heading', { name: 'No active SOS blood requests right now.' }).waitFor();
  } finally { await page.close(); }
});
