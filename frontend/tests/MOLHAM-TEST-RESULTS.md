# Molham frontend verification

Date: 5 November 2026, Asia/Damascus. Branch: `molham`.

## Result

Molham's assigned frontend implementation is complete. Local checks pass. Real API/database integration is pending the backend team's implementation.

| Check | Observed result |
| --- | --- |
| `npm test` | PASS: 22 unit/render tests, zero failures |
| `npm run test:browser` | PASS: 18 browser tests, zero failures |
| `npm run lint` | PASS: zero errors or warnings |
| `npm run build` | PASS: TypeScript checks and Vite production build |
| `git diff --check` | PASS |
| `npm run test:api` | INCOMPLETE: `fetch failed` at `http://localhost:3000/api` |

Environment: Windows, Node.js 24.15.0, TypeScript 6.0.3, locally installed Chrome, and the desktop runtime's existing Playwright package. The existing starter TypeScript 7/linter conflict was corrected in its own commit. No new testing library was added to the project.

## Official Molham test table

| Scenario | Actual outcome | Verification type |
| --- | --- | --- |
| Open the board with requests | Server order retained, including urgency and creation-time order supplied by the fixture; required public fields displayed | Browser with contract-shaped API responses |
| Open the board with no requests | Friendly empty message appears, with no error alert | Browser with API returning `[]` |
| Registration validation/conflict | Exact 400/409 messages appear inside the form; typed values remain intact | Browser with backend error responses; native field checks |
| Wrong sign-in password | Exact generic credentials message appears; form can be corrected and retried | Browser with API returning 401 |
| Refresh while signed in | Stored `bdn.token` restores the donor through `/auth/me` | Browser with API response; real localStorage |

## Additional coverage

- Types and API functions preserve the contract's unwrapped response shapes and payload fields. Blank optional registration email is omitted; supplied email is trimmed and lowercased.
- Public cards do not render injected patient references, notes or donor names. The frontend does not reorder responses or calculate units still needed.
- Date tests cover leap day, invalid dates, month/year boundaries and local midnight in Asia/Damascus, America/Los_Angeles and Pacific/Kiritimati. API timestamps display in UTC and are labelled UTC on the board.
- Shared component checks cover optional props, all button variants/sizes, disabled/loading behavior and every supported status/urgency badge. Badges always include text.
- Browser checks cover donor/coordinator redirects, native required inputs, password minimum length, duplicate submission prevention, area failure/retry, empty areas, optional email, sign-in network failure and retained form values.
- Session checks cover no-token startup, refresh, sign-out, 401/403 cleanup, transient network recovery, and a delayed restoration response after sign-out. StrictMode is enabled during these checks.
- Role-aware routing shows a sign-in prompt to visitors and an access-restricted message to the wrong role. These UI checks do not replace backend authorization.
- SOS loading, empty, failed and recovered responses are tested separately. Visitor, donor and coordinator card actions use the appropriate destinations.
- The 404 return link works with the keyboard at phone width. The public pages fit 320px, 768px and 1280px widths without horizontal overflow or uncaught browser errors. The skip-to-content link is keyboard reachable.
- Desktop and phone screenshots were visually reviewed for layout and readable forms/cards.
- Source review found no direct fetch/service calls in pages/components, no hardcoded colors in the added component/page CSS, and token storage access only in the shared HTTP helper.

## Remaining live checks

The backend source currently registers only the starter `AppController` and `AppService`. The required auth, areas, SOS endpoints and Prisma seed/database are not present. The live smoke check was attempted and did not connect.

Once the backend is available, run `npm run test:api`, then repeat registration, sign-in by both roles, refresh and sign-out against seeded local test accounts. Verify the real SOS payload's privacy and ordering, and verify that the board reflects real request creation/fulfillment/cancellation after refreshing or returning to the board.

Database persistence, backend DTO validation, backend role enforcement and the coordinator donation transaction have not been verified here. They belong to the backend/integration tasks. The local mocked browser checks must not be described as a passing real API or database test.
