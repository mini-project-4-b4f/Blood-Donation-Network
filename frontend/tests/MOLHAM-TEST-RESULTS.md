# Molham frontend verification

Branch: `molham`. Initial checks ran on 5 November 2026. The results below reflect the 14 November 2026 merge with `main`.

## Result

Molham's assigned frontend implementation passes its automated checks. A live smoke check verified the public API against an isolated PostgreSQL database with the project's sample data.

| Check | Observed result |
| --- | --- |
| `npm test` | PASS: 22 unit/render tests, zero failures |
| `npm run test:browser` | PASS: 18 browser tests, zero failures |
| `npm run lint` | PASS: zero errors or warnings |
| `npm run build` | PASS: TypeScript checks and Vite production build |
| `git diff --check` | PASS |
| `npm run test:api` | PASS: area list, three public SOS requests with correct fields and ordering, and unauthenticated `/auth/me` rejection |
| Backend `npm run build` | PASS after generating the Prisma client |
| Backend `npm test -- --runInBand` | 72 passed, 10 failed in the existing request and donor DTO validation suite |

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
- The browser suite confirms that the donor dashboard and profile open after sign-in and that donor requests carry the shared session token.

## Remaining live checks

The live check covers read-only endpoints. Signed-in browser flows use mocked responses. Coordinator request and donation workflows are outside this verification.
