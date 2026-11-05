import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { areas, baseURL, donor, json, startBrowser, waitText } from './helpers.mjs';

let runtime;
before(async () => { runtime = await startBrowser(); });
after(async () => { await runtime?.close(); });

test('browser: sign-in, refresh and sign-out preserve the session contract', async () => {
  const page = await runtime.browser.newPage();
  try {
    await page.route('**/api/auth/sign-in', (route) => json(route, { accessToken: 'test-token', user: donor }));
    await page.route('**/api/auth/me', (route) => json(route, donor));
    await page.goto(`${baseURL}/tests/fixtures/auth.html`);
    await waitText(page, 'loading', 'false');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await waitText(page, 'user', 'DONOR');
    assert.equal(await page.evaluate(() => localStorage.getItem('bdn.token')), 'test-token');
    await page.reload();
    await waitText(page, 'user', 'DONOR');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await waitText(page, 'user', 'none');
    assert.equal(await page.evaluate(() => localStorage.getItem('bdn.token')), null);
  } finally { await page.close(); }
});

test('browser: invalid sessions are cleared but network outages can be retried', async () => {
  const page = await runtime.browser.newPage();
  let responseStatus = 401;
  try {
    await page.addInitScript(() => localStorage.setItem('bdn.token', 'stored-token'));
    await page.route('**/api/auth/me', (route) => responseStatus === 0 ? route.abort() : json(route, responseStatus === 200 ? donor : { message: 'Authentication required. Please sign in.' }, responseStatus));
    for (const status of [401, 403]) {
      responseStatus = status;
      await page.goto(`${baseURL}/tests/fixtures/auth.html`);
      await waitText(page, 'loading', 'false');
      assert.equal(await page.evaluate(() => localStorage.getItem('bdn.token')), null);
    }
    responseStatus = 0;
    await page.reload();
    await waitText(page, 'loading', 'false');
    assert.equal(await page.evaluate(() => localStorage.getItem('bdn.token')), 'stored-token');
    responseStatus = 200;
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await waitText(page, 'user', 'DONOR');
  } finally { await page.close(); }
});

test('browser: a late restoration response cannot undo sign-out', async () => {
  const page = await runtime.browser.newPage();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  try {
    await page.addInitScript(() => localStorage.setItem('bdn.token', 'stored-token'));
    await page.route('**/api/auth/me', async (route) => { await gate; await json(route, donor).catch(() => {}); });
    await page.goto(`${baseURL}/tests/fixtures/auth.html`);
    await waitText(page, 'loading', 'true');
    await page.getByRole('button', { name: 'Sign out' }).click();
    release();
    await waitText(page, 'loading', 'false');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByTestId('user').textContent(), 'none');
    assert.equal(await page.evaluate(() => localStorage.getItem('bdn.token')), null);
  } finally { release(); await page.close(); }
});

test('browser: area failure recovers and registration returns a signed-in user', async () => {
  const page = await runtime.browser.newPage();
  let failAreas = true;
  try {
    await page.route('**/api/areas', (route) => json(route, failAreas ? { message: 'Areas unavailable.' } : areas, failAreas ? 500 : 200));
    await page.route('**/api/auth/sign-up', (route) => json(route, { accessToken: 'new-token', user: donor }, 201));
    await page.goto(`${baseURL}/tests/fixtures/auth.html`);
    await page.getByRole('button', { name: 'Load areas' }).click();
    await waitText(page, 'error', 'Areas unavailable.');
    await waitText(page, 'areas-loading', 'false');
    failAreas = false;
    await page.getByRole('button', { name: 'Load areas' }).click();
    await waitText(page, 'areas', '2');
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await waitText(page, 'user', 'DONOR');
    assert.equal(await page.getByTestId('error').textContent(), '');
  } finally { await page.close(); }
});
