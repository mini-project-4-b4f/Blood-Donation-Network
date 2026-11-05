import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { areas, baseURL, coordinator, donor, json, startBrowser } from './helpers.mjs';

let runtime;
before(async () => { runtime = await startBrowser(); });
after(async () => { await runtime?.close(); });
const requests = [
  { id: 'critical-old', bloodType: 'A-', urgency: 'CRITICAL', area: areas[0], hospital: 'Homs Blood Bank', unitsStillNeeded: 3, createdAt: '2026-11-01T09:10:00Z' },
  { id: 'critical-new', bloodType: 'O-', urgency: 'CRITICAL', area: areas[1], hospital: 'Damascus Hospital', unitsStillNeeded: 1, createdAt: '2026-11-01T10:10:00Z' },
  { id: 'high', bloodType: 'AB+', urgency: 'HIGH', area: areas[0], hospital: 'Community Hospital', unitsStillNeeded: 2, createdAt: '2026-10-31T09:10:00Z' },
  { id: 'normal', bloodType: 'B+', urgency: 'NORMAL', area: areas[0], hospital: 'Regional Hospital', unitsStillNeeded: 4, createdAt: '2026-10-30T09:10:00Z' },
];

test('browser: SOS cards preserve backend ordering and exclude private fields', async () => {
  const page = await runtime.browser.newPage();
  try {
    await page.route('**/api/requests/sos', (route) => json(route, requests.map((request) => ({ ...request, patientReference: 'PRIVATE-PATIENT', note: 'PRIVATE-NOTE', donorName: 'PRIVATE-DONOR' }))));
    await page.goto(baseURL);
    await page.getByRole('article').first().waitFor();
    assert.deepEqual(await page.locator('.sos-board-card__hospital').allTextContents(), requests.map((request) => request.hospital));
    assert.doesNotMatch(await page.locator('main').textContent(), /PRIVATE-/);
    assert.match(await page.getByRole('article').nth(1).textContent(), /1 unit still needed/);
    assert.equal(await page.getByRole('article').first().getByRole('link').getAttribute('href'), '/sign-in');
  } finally { await page.close(); }
});

test('browser: loading, empty, failure and retry states remain distinct', async () => {
  const page = await runtime.browser.newPage();
  let mode = 'empty';
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  try {
    await page.route('**/api/requests/sos', async (route) => {
      await gate;
      return json(route, mode === 'error' ? { message: 'Requests unavailable.' } : mode === 'populated' ? requests : [], mode === 'error' ? 500 : 200);
    });
    await page.goto(baseURL);
    await page.getByRole('status').getByText('Loading blood requests…').waitFor();
    release();
    await page.getByRole('heading', { name: 'No active SOS blood requests right now.' }).waitFor();
    mode = 'error';
    await page.getByRole('button', { name: 'Refresh requests', exact: true }).click();
    await page.getByRole('alert').getByText('Requests unavailable.').waitFor();
    assert.equal(await page.getByRole('heading', { name: 'No active SOS blood requests right now.' }).count(), 0);
    mode = 'populated';
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.getByRole('article').first().waitFor();
    assert.equal(await page.getByRole('article').count(), 4);
  } finally { release(); await page.close(); }
});

test('browser: board actions send donors and coordinators to their own workspaces', async () => {
  for (const user of [donor, coordinator]) {
    const page = await runtime.browser.newPage();
    try {
      await page.addInitScript(() => localStorage.setItem('bdn.token', 'test-token'));
      await page.route('**/api/auth/me', (route) => json(route, user));
      await page.route('**/api/requests/sos', (route) => json(route, requests));
      await page.goto(baseURL);
      await page.getByRole('button', { name: 'Sign Out' }).waitFor();
      await page.getByRole('article').first().waitFor();
      assert.equal(await page.getByRole('article').first().getByRole('link').getAttribute('href'), user.role === 'DONOR' ? '/donor/dashboard' : '/coordinator/requests');
    } finally { await page.close(); }
  }
});

test('browser: public pages fit phone, tablet and desktop widths without console errors', async () => {
  const page = await runtime.browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.route('**/api/requests/sos', (route) => json(route, requests));
    await page.route('**/api/areas', (route) => json(route, areas));
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/', '/sign-in', '/sign-up']) {
        await page.goto(`${baseURL}${route}`);
        await page.waitForLoadState('networkidle');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} overflow at ${width}px`);
        if (process.env.MOLHAM_SCREENSHOT_DIR) {
          await mkdir(process.env.MOLHAM_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.MOLHAM_SCREENSHOT_DIR, `${route === '/' ? 'sos' : route.slice(1)}-${width}.png`), fullPage: true });
        }
      }
    }
    assert.deepEqual(errors, []);
    await page.goto(baseURL);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
  } finally { await page.close(); }
});
