import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { areas, baseURL, coordinator, donor, json, startBrowser } from './helpers.mjs';

let runtime;
before(async () => { runtime = await startBrowser(); });
after(async () => { await runtime?.close(); });

async function fillRegistration(page, email = '') {
  await page.getByLabel('Full name', { exact: true }).fill('Sara Test');
  await page.getByLabel('Phone number', { exact: true }).fill('0933112233');
  await page.getByLabel('Email (optional)', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Password123');
  await page.getByLabel('Blood type', { exact: true }).selectOption('A-');
  await page.getByLabel('Area', { exact: true }).selectOption('area-homs');
}

test('browser: phone/email sign-in shows exact errors and redirects both roles', async () => {
  for (const user of [donor, coordinator]) {
    const page = await runtime.browser.newPage();
    let status = 401;
    try {
      await page.route('**/api/auth/sign-in', (route) => json(route, status === 200 ? { accessToken: 'token', user } : { message: 'Invalid credentials. Please check your phone/email and password.' }, status));
      await page.goto(`${baseURL}/sign-in`);
      await page.getByLabel('Phone number or email').fill(user.role === 'DONOR' ? '0933112233' : 'coordinator@example.com');
      await page.getByLabel('Password', { exact: true }).fill('WrongPassword');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.getByRole('alert').getByText('Invalid credentials. Please check your phone/email and password.', { exact: true }).waitFor();
      assert.equal(await page.getByLabel('Password', { exact: true }).inputValue(), 'WrongPassword');
      status = 200;
      await page.getByLabel('Password', { exact: true }).fill('Password123');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForURL(`**${user.role === 'DONOR' ? '/donor/dashboard' : '/coordinator/requests'}`);
      await page.getByRole('button', { name: 'Sign Out' }).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem('bdn.token')), 'token');
    } finally { await page.close(); }
  }
});

test('browser: registration preserves values for 400/409 errors and supports optional email', async () => {
  const page = await runtime.browser.newPage();
  let error = { status: 409, message: 'An account with this phone number is already registered.' };
  const bodies = [];
  try {
    await page.route('**/api/areas', (route) => json(route, areas));
    await page.route('**/api/auth/sign-up', (route) => {
      bodies.push(route.request().postDataJSON());
      return json(route, error ? { message: error.message } : { accessToken: 'registered', user: donor }, error?.status ?? 201);
    });
    await page.goto(`${baseURL}/sign-up`);
    await page.getByLabel('Area', { exact: true }).getByRole('option', { name: 'Homs' }).waitFor({ state: 'attached' });
    assert.equal(await page.getByLabel('Blood type', { exact: true }).getByRole('option').count(), 9);
    await fillRegistration(page);
    for (const nextError of [error, { status: 409, message: 'An account with this email address is already registered.' }, { status: 400, message: 'Selected area is not supported.' }]) {
      error = nextError;
      await page.getByRole('button', { name: 'Create Donor Account' }).click();
      await page.getByRole('alert').getByText(error.message, { exact: true }).waitFor();
      assert.equal(await page.getByLabel('Full name', { exact: true }).inputValue(), 'Sara Test');
      assert.equal(await page.getByLabel('Password', { exact: true }).inputValue(), 'Password123');
    }
    assert.ok(!Object.hasOwn(bodies[0], 'email'));
    error = null;
    await page.getByLabel('Email (optional)', { exact: true }).fill('sara@example.com');
    await page.getByRole('button', { name: 'Create Donor Account' }).click();
    await page.waitForURL('**/donor/dashboard');
    assert.equal(bodies.at(-1).email, 'sara@example.com');
  } finally { await page.close(); }
});

test('browser: area failures offer retry and do not leave the form loading', async () => {
  const page = await runtime.browser.newPage();
  let fail = true;
  try {
    await page.route('**/api/areas', (route) => json(route, fail ? { message: 'Areas temporarily unavailable.' } : areas, fail ? 500 : 200));
    await page.goto(`${baseURL}/sign-up`);
    await page.getByRole('alert').getByText('Areas temporarily unavailable.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Create Donor Account' }).isDisabled(), true);
    fail = false;
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.getByLabel('Area', { exact: true }).getByRole('option', { name: 'Homs' }).waitFor({ state: 'attached' });
    assert.equal(await page.getByLabel('Area', { exact: true }).isEnabled(), true);
  } finally { await page.close(); }
});

test('browser: native required fields and pending submissions prevent duplicate requests', async () => {
  const page = await runtime.browser.newPage();
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  try {
    await page.route('**/api/auth/sign-in', async (route) => { calls += 1; await gate; await json(route, { message: 'This account has been deactivated.' }, 403); });
    await page.goto(`${baseURL}/sign-in`);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    assert.equal(calls, 0);
    await page.getByLabel('Phone number or email').fill('0933112233');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('button[type="submit"]')?.disabled);
    await page.locator('form').evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
    release();
    await page.getByRole('alert').getByText('This account has been deactivated.').waitFor();
    assert.equal(calls, 1);
    assert.equal(await page.getByRole('button', { name: 'Sign In', exact: true }).isEnabled(), true);
  } finally { release(); await page.close(); }
});
