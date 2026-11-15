import { createRequire } from 'node:module';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
export const donor = {
  id: 'test-donor', phone: '0933112233', email: null, role: 'DONOR', isActive: true,
  donorProfile: { id: 'profile-test', fullName: 'Test Donor', bloodType: 'A-', area: { id: 'area-homs', name: 'Homs' }, isAvailable: true },
};
export const coordinator = { ...donor, id: 'test-coordinator', role: 'COORDINATOR', donorProfile: null };
export const areas = [{ id: 'area-homs', name: 'Homs' }, { id: 'area-damascus', name: 'Damascus' }];
export const baseURL = 'http://127.0.0.1:5178';

export async function startBrowser() {
  // The desktop runtime can provide Playwright without changing project dependencies.
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
  const server = await createServer({ server: { host: '127.0.0.1', port: 5178, strictPort: true }, logLevel: 'error' });
  await server.listen();
  try {
    const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    return { browser, async close() { await browser.close(); await server.close(); } };
  } catch (error) {
    await server.close();
    throw error;
  }
}

export function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
}

export async function waitText(page, id, text) {
  await page.waitForFunction(({ id, text }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === text, { id, text });
}
