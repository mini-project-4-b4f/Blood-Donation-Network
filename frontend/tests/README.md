# Frontend checks

Run commands from `frontend/` with Node.js 24 and the locked dependencies installed.

```powershell
npm ci
npm test
npm run lint
npm run build
```

`npm test` uses Node's built-in test runner, the existing TypeScript compiler and React's server renderer. It adds no testing dependencies. The loader is only used by tests; it is not part of the application build.

## Browser checks

```powershell
npm run test:browser
```

The browser suite needs an existing Playwright installation and an installed Chrome browser. If Playwright is supplied by your desktop runtime, set `PLAYWRIGHT_MODULE_PATH` to that existing package directory before running the command. The checked-in project does not add Playwright as a dependency. Set `BROWSER_CHANNEL=msedge` to use an installed Edge browser instead of Chrome.

Each test file starts Vite on `127.0.0.1:5178`, uses an isolated browser context, and closes both after testing. Keep that port free. Test fixtures live under `tests/fixtures/`; they are not application routes and are not emitted by the production build.

Browser API responses are intercepted using the documented contract. They test the real React pages and Contexts, but do not establish that the backend or database implements that contract.

Optional: set `MOLHAM_SCREENSHOT_DIR` to a local output directory to save desktop, tablet and phone screenshots during the SOS browser checks. Screenshots are not committed as test source.

## Live API checks

```powershell
npm run test:api
```

This read-only smoke check calls the real `/areas`, `/requests/sos` and unauthenticated `/auth/me` endpoints at `http://localhost:3000/api`. Set `VITE_API_URL` in the shell for another local API base URL. The command fails clearly if the API is missing or does not match its public contract. It does not create accounts, reset a database or record donations.

For the application, copy `.env.example` to `.env` when using a different API URL, then restart Vite. Full integration also requires the team's real authentication, donor, request and database features.

See `MOLHAM-TEST-RESULTS.md` for observed results and `MOLHAM-HANDOFF.md` for integration dependencies and the presentation script.
