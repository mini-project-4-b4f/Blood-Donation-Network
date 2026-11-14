# Molham frontend handoff

Branch: `molham`. The branch includes the latest `main` used for the pull request.

## Delivered

- Documented authentication types, display constants and date/phone/unit formatters.
- Loading, ErrorMessage, EmptyState, Button, StatusBadge, UrgencyBadge and BloodTypeBadge with the fixed shared props.
- Typed auth API functions and AuthContext, including session restoration, invalid-token cleanup, sign-out and protection against stale responses.
- Sign-in and donor registration pages with inline backend errors, API-loaded areas, optional email, retained inputs and role redirects.
- Public SOS board, public-only request cards, API ordering, loading/empty/error/retry states and role-aware links.
- Friendly 404 page with a keyboard-accessible return link.
- The approved missing frontend foundation: HTTP helper, canonical donor/request types, theme, layout, guarded routing and public SOS Context loading.
- Unit/render tests, browser tests, a read-only live API smoke check, test instructions and observed results.

The code follows the reference folder's straightforward function/props/controlled-input style while retaining this project's Context-only API architecture. Short comments explain date handling, token fallback and stale-response prevention.

## Teammate integration

| Owner | Remaining dependency |
| --- | --- |
| Eyad | Review of the shared frontend foundation and team integration |
| Adham | Review the request validation test failures inherited from `main` |
| Rami | Coordinator API functions, coordinator pages and the remaining RequestsContext actions |
| Taymaa | Review the connection between the donor pages and the shared session |

The donor routes display the team's dashboard and profile and use the shared session for their API calls. RequestsContext connects public SOS loading to the real endpoint. Coordinator pages and actions remain placeholders for Rami's work.

To run the UI, use `npm run dev` from `frontend/`. The default API URL is `http://localhost:3000/api`; `.env.example` documents `VITE_API_URL`. See the test README for commands and runtime requirements.

## Implementation commits

| Commit | Change |
| --- | --- |
| `cfdf66c` | Correct the starter TypeScript/linter incompatibility |
| `5fb9d61` | Auth types, display constants and utilities |
| `34fca23` | Approved HTTP/type foundation and Node test setup |
| `c66ac8a` | Shared UI components |
| `040df5d` | Authentication API functions |
| `ba9a6f5` | AuthContext and session lifecycle tests |
| `908efc0` | Approved theme/layout/protected routing foundation |
| `fb13595` | Authentication pages and form behavior tests |
| `4b9b875` | Public SOS board and public Context loading |
| `432eaf1` | Not-found page and keyboard return test |

The final test-record commit follows these implementation commits. Its identifier is available in `git log`.

## English presentation script

Today I am demonstrating the public SOS board and the sign-in and donor registration experience.

The board shows open blood requests from hospitals and blood banks. Each card displays blood type, urgency, area, hospital, units still needed and the posting time. It follows the API's order, with the most urgent requests first. It never shows patient references, coordinator notes or donor contact details.

Visitors can become donors or sign in. Registration loads supported areas from the API and offers all eight blood types. If registration is rejected, the form displays the backend's explanation and keeps the entered details so the person can correct them. Sign-in supports both donors and coordinators and opens the correct workspace for each role.

The shared components give these pages consistent loading, empty and error states. For example, an empty board shows that there are no active requests, while an API failure shows an error with a retry button. They are different states and are presented differently.

The session survives a refresh through the stored token and the current-user endpoint. Signing out clears it, and an old request cannot silently restore that session afterward.

Controlled API responses let me demonstrate success and failure cases reliably. The merged backend can also serve the public SOS board and area list using the project's sample database.
