import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { areas, baseURL, json, startBrowser } from './helpers.mjs';

let runtime;
before(async () => { runtime = await startBrowser(); });
after(async () => { await runtime?.close(); });

test('browser: sign-in shows a network error, retains inputs and allows retry', async () => {
  const page = await runtime.browser.newPage();
  try {
    await page.route('**/api/auth/sign-in', (route) => route.abort());
    await page.goto(`${baseURL}/sign-in`);
    await page.getByLabel('Phone number or email').fill('0933112233');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.getByRole('alert').getByText('Cannot reach the server. Please check your connection and try again.').waitFor();
    assert.equal(await page.getByLabel('Phone number or email').inputValue(), '0933112233');
    assert.equal(await page.getByRole('button', { name: 'Sign In', exact: true }).isEnabled(), true);
  } finally { await page.close(); }
});

test('browser: registration required fields and password rules prevent invalid requests', async () => {
  const page = await runtime.browser.newPage();
  let calls = 0;
  try {
    await page.route('**/api/areas', (route) => json(route, areas));
    await page.route('**/api/auth/sign-up', (route) => { calls += 1; return json(route, { message: 'Invalid payload.' }, 400); });
    await page.goto(`${baseURL}/sign-up`);
    await page.getByLabel('Area', { exact: true }).locator('option[value="area-homs"]').waitFor({ state: 'attached' });
    await page.getByRole('button', { name: 'Create Donor Account' }).click();
    assert.equal(calls, 0);
    await page.getByLabel('Full name', { exact: true }).fill('   ');
    assert.equal(await page.getByLabel('Full name', { exact: true }).evaluate((input) => input.checkValidity()), false);
    await page.getByLabel('Password', { exact: true }).fill('short');
    assert.equal(await page.getByLabel('Password', { exact: true }).evaluate((input) => input.checkValidity()), false);
  } finally { await page.close(); }
});

test('browser: an empty areas response shows a retryable message instead of an unusable form', async () => {
  const page = await runtime.browser.newPage();
  try {
    await page.route('**/api/areas', (route) => json(route, []));
    await page.goto(`${baseURL}/sign-up`);
    await page.getByRole('alert').getByText('No supported areas are available right now.').waitFor();
    assert.equal(await page.getByLabel('Area', { exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Create Donor Account' }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Try again' }).isVisible(), true);
  } finally { await page.close(); }
});
