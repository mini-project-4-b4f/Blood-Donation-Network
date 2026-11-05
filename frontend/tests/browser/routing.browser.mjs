import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { baseURL, donor, json, startBrowser } from './helpers.mjs';

let runtime;
before(async () => { runtime = await startBrowser(); });
after(async () => { await runtime?.close(); });

test('browser: protected workspaces show a sign-in prompt to visitors', async () => {
  const page = await runtime.browser.newPage();
  try {
    await page.goto(`${baseURL}/donor/dashboard`);
    await page.getByRole('heading', { name: 'Sign-In Required' }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Go to Sign In' }).getAttribute('href'), '/sign-in');
  } finally { await page.close(); }
});

test('browser: donor navigation is role-aware and coordinator routes reject the wrong role', async () => {
  const page = await runtime.browser.newPage();
  try {
    await page.addInitScript(() => localStorage.setItem('bdn.token', 'test-token'));
    await page.route('**/api/auth/me', (route) => json(route, donor));
    await page.goto(`${baseURL}/coordinator/requests`);
    await page.getByRole('heading', { name: 'Access Restricted' }).waitFor();
    assert.equal(await page.getByRole('navigation').getByRole('link', { name: 'My Dashboard' }).getAttribute('href'), '/donor/dashboard');
    await page.getByRole('link', { name: 'Go to my workspace' }).click();
    await page.getByRole('heading', { name: 'My Dashboard' }).waitFor();
  } finally { await page.close(); }
});
