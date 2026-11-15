# Task 6 — Coordinator Frontend Integration Handoff

**Status: implemented and isolated-tested; ready for team review, not final integration approval.**

Reviewed baseline: `member-rami` at merge commit `2ba27e78d07565dffcc004eccc3cb4f9369affa9`, containing `origin/main` at `b38993d`. Findings below describe this merged tree and the local installed environment. Verification results come from the post-merge audit; checks were not rerun for this documentation-only change.

## Delivered scope

Rami's 17 implementation files remain identical to Task 6 commit `3f36c18`:

| Area | Implementation |
| --- | --- |
| Types, API and state | `frontend/src/types/request.types.ts`, `frontend/src/services/requests.api.ts`, `frontend/src/context/RequestsContext.tsx` |
| `frontend/src/pages/Requests/` | Requests list, four filters with URL/Back/Forward synchronization, table, Create Request modal and CSS |
| `frontend/src/pages/RequestDetails/` | Details, counters, pledge/donation history, Update, Cancel and Record Donation dialogs, and CSS |
| `frontend/src/pages/EligibleDonors/` | Ranked donor rows, request context, three excluded counts and CSS |

Components use Context rather than direct API calls. The implementation includes independent loading/error states, backend error display, mutation refresh, stale-response protection, duplicate-submit prevention and accessible dialogs. Donor ranking, eligibility and request counters remain backend responsibilities. Earlier isolated checks used test-only substitutes for unavailable dependencies; they do not establish real application or API compatibility.

The merged architecture already mounts `AuthProvider > DonorProvider > RequestsProvider > AppRouter` in `frontend/src/App.tsx:9`. `frontend/src/routes/AppRouter.tsx:16` owns the single `BrowserRouter`; lines 31–36 define the three protected Coordinator routes. Preserve this structure during integration.

## Confirmed blockers and owner action items

### Molham — Authentication, shared UI and public pages

Confirmed missing modules:

- `frontend/src/context/AuthContext.tsx`, `frontend/src/types/auth.types.ts`, `frontend/src/constants.ts`.
- `frontend/src/components/common/`: `Loading.tsx`, `ErrorMessage.tsx`, `EmptyState.tsx`, `Button.tsx`, `StatusBadge.tsx`, `UrgencyBadge.tsx`, `BloodTypeBadge.tsx`.
- `frontend/src/utils/format.ts`, `frontend/src/utils/date.ts`.
- `frontend/src/pages/SignIn/SignInPage.tsx`, `frontend/src/pages/SignUp/SignUpPage.tsx`, `frontend/src/pages/SosBoard/SosBoardPage.tsx`, `frontend/src/pages/NotFound/NotFoundPage.tsx`.

Imports in `frontend/src/App.tsx:1`, `frontend/src/pages/Requests/RequestsPage.tsx:3` and `frontend/src/routes/AppRouter.tsx:7` currently prevent compilation. The shared layout also imports missing `frontend/src/components/common/Icon.tsx`; Eyad and Molham should confirm its shared interface and ownership because this additional component is not defined in the fixed shared-component table.

- [ ] Deliver the documented exports, Context value, component props, constants and formatting/date functions; connect authentication and areas to the real API. Eyad should coordinate completion of the Phase 0 foundation.
- [ ] Verify shared controls preserve button disabling, labels, focus and loading/error behavior required by Coordinator dialogs. Do not substitute production placeholders.

### Eyad — Shared HTTP boundary

`frontend/src/services/requests.api.ts:1` imports `./http`, as documented, but the existing client is `frontend/src/service/http.ts` (singular directory). Its `RequestOptions` at line 49 accepts no `headers` and its implementation serializes `body` at line 75. Request mutations currently pass headers and an already serialized JSON body, for example `frontend/src/services/requests.api.ts:36`.

Correcting only the import path would leave an options-type mismatch and could double-serialize mutation payloads. The documentation fixes `request<T>(path, options?)` and its behavior, but does not fully define the options type; this boundary needs agreement, not an assumed new contract.

- [ ] Supply the documented `frontend/src/services/http.ts` location and agree one compatible options contract with service owners. Encode JSON exactly once, support the agreed header handling, and preserve parsed response types and `ApiError` backend messages.
- [ ] Keep token handling and network/authorization errors centralized. Any necessary Task 6 service adjustment must be coordinated with Rami; do not duplicate HTTP/authentication logic.

### Taymaa — Donor service/types and session behavior

`frontend/src/context/RequestsContext.tsx:12–13` imports the missing named exports `getAllDonors` and `CoordinatorDonorItem` from existing `frontend/src/services/donors.api.ts` and `frontend/src/types/donor.types.ts`. This blocks Context compilation and Record Donation's donor options. The backend `GET /api/donors` endpoint exists; it has not been exercised in this integration.

Both `frontend/src/services/donors.api.ts:7` and `frontend/src/services/pledges.api.ts:7` read the key `token` and use direct HTTP calls, while the shared client uses `bdn.token`. `frontend/src/context/DonorContext.tsx:47–49` loads donor-only data unconditionally although the provider also wraps Coordinator/public routes.

- [ ] Export `getAllDonors(): Promise<CoordinatorDonorItem[]>` and the exact documented donor type; implement the call through the agreed shared HTTP client.
- [ ] Align donor/pledge services with shared token/error handling. Load donor-only resources only after a verified `DONOR` session, and clear session-specific state appropriately.
- [ ] Resolve the existing donor-area lint errors in `DonorContext.tsx`, `frontend/src/pages/DonorDashboard/EligibilityBanner.tsx` and `frontend/src/pages/DonorProfile/DonorProfilePage.tsx` without changing documented public interfaces.

### Adham — Request lifecycle and response contracts

| Confirmed issue and location | Required action |
| --- | --- |
| `backend/src/requests/requests.service.ts:34`, list query at line 124 and detail query at line 137 map raw requests with area only. Coordinator counters are missing; details also omit `pledges` and `donations`. | Return complete `CoordinatorRequestSummary` items and `CoordinatorRequestDetails` from the documented endpoints, including backend-computed `unitsStillNeeded`, `activePledgesCount` and nested donor/recording-coordinator data. Apply the correct detail response to create/update/cancel as well. |
| `backend/src/donations/donations.service.ts:211` returns a donation record, while the contract requires updated `CoordinatorRequestDetails`. | Return the updated request details after the existing atomic donation operation. `frontend/src/context/RequestsContext.tsx:468–470` needs request identity, counters and status for refresh; a donation ID is not a request ID. |
| `backend/src/requests/requests.service.ts:221–247` cancels the request without releasing active pledges. | Perform cancellation and `PLEDGED` → `RELEASED` updates together in a transaction, then return the complete updated details. |
| `backend/src/requests/requests.service.ts:78–95` creates without checking for an existing OPEN request with the same normalized patient reference and blood type. | Enforce duplicate prevention safely, including concurrent creation, and return the documented `409` message. Coordinate any database enforcement with Eyad. |

- [ ] Verify these responses and lifecycle rules with real API tests, including automatic fulfillment when required units are reduced to collected units and when the final donation is recorded. Do not compensate with frontend business calculations or fabricated empty histories.

### Eyad — Backend setup and TypeScript toolchain

The local generated Prisma client lacks the schema's model/enum exports. The source schema is `backend/prisma/schema.prisma`; generation/setup is required before a reliable backend build. Database connectivity, migrations, seed data and live server behavior remain unverified.

`frontend/package.json:32` specifies TypeScript `~7.0.2`, and `frontend/package-lock.json` locks `7.0.2`. The installed compiler is `6.0.3`. Installed `typescript-eslint`/parser `8.72.1` declares TypeScript support `>=4.8.4 <6.1.0`: installed 6.0.3 is in range; declared 7.0.2 is outside it. Checks using 6.0.3 do not validate a clean install of the locked toolchain.

- [ ] Generate Prisma Client from the actual schema and verify the approved database/build environment; then rerun backend checks.
- [ ] Resolve compiler/linter compatibility in the shared project configuration and validate a consistent installation. This handoff does not change dependencies or prescribe an unverified upgrade.

### Laith / Eyad — Remaining backend typing issues

Independent of missing Prisma exports, `backend/src/pledges/pledges.service.ts:78–79` reads `forDonor` without successful narrowing of `EligibilityCheckResult`. The matching test at `backend/src/matching/matching.service.spec.ts:250–251` similarly reads rejection-only fields. The union is defined in `backend/src/matching/matching.types.ts:41`.

- [ ] Laith: use explicit discriminant checks such as `eligible === false` before reading rejection fields in PledgesService.
- [ ] Eyad: apply equivalent safe narrowing in the matching test, then rerun production type-checking and matching/pledge tests. Keep eligibility decisions in MatchingService.

## Recorded verification and limits

| Check | Post-merge result |
| --- | --- |
| Task 6 ESLint | Pass: all 14 TypeScript/TSX files, zero errors/warnings. The three CSS files are not covered by this check. |
| Full frontend ESLint | Fail: 11 errors, zero warnings, in donor-owned files. |
| Frontend `tsconfig.app.json`, no emit/incremental output | Fail under installed TypeScript 6.0.3: 69 diagnostics (66 missing-module errors, two missing exports, one unused binding). |
| Frontend `tsconfig.node.json`, no emit/incremental output | Pass under installed TypeScript 6.0.3. |
| Vite with actual configuration and `write: false` | Fail: unresolved `./context/AuthContext` at `frontend/src/App.tsx:1`. No production bundle was written. |
| Backend `tsconfig.build.json`, no emit/incremental output | Fail: 39 diagnostics. Broader `tsconfig.json` check including tests reports 42. An emitted backend build was not run. |
| Real authentication/API/database/end-to-end flows | Not verified. Earlier isolated interaction tests do not cover these integrations. |

## Final integration acceptance checklist

- [ ] Owners complete the above actions using the fixed interfaces and API contracts. Eyad confirms protected routes and the single-router/provider setup against real authentication.
- [ ] The agreed installed toolchain passes frontend/backend type-checks, full ESLint and production builds without missing imports, suppression comments or placeholder modules.
- [ ] Rami and Eyad verify list filters/reset/URL Back–Forward; create; details; update; cancellation; donation selection/preselection; and eligible/excluded results against the real backend.
- [ ] Verify exact backend errors, preserved form drafts on rejection, duplicate-submit protection, retries, authorization failures and post-mutation refresh without browser reloads.
- [ ] Verify OPEN → FULFILLED/CANCELLED transitions, completed/released pledges, donation history and donor-data refresh. Terminal requests retain history and expose no mutation/matching actions.
- [ ] Confirm backend donor ordering and all three exclusion counts, public SOS privacy, keyboard/focus behavior, and English LTR layouts at 1440, 768 and 390 px using real shared components.
- [ ] Record successful integration evidence and obtain team-lead review before final merge approval. Until then, treat the PR as team review only.

## Authoritative references

- [Original specification](Blood%20Donation%20Network%20-%20Iyad%20Ibrahim.pdf): FR-5, FR-6, FR-9, FR-12, FR-13; request lifecycle, transactions and privacy rules.
- [Tasks.pdf](Tasks.pdf), Sections 4–5 and 7–11: ownership, foundation and Task 6 acceptance. The searchable companion is [Tasks](Tasks).
- [Project Structure](Project%20Structure): routes, Context interfaces, shared components, HTTP/services, types and ownership. Documented `client/` and `api/` map to actual `frontend/` and `backend/`; no folder rename is intended.
- [Api](Api), Sections 4.4–4.5, 7–13 and 18: response shapes, lifecycle endpoints, donor listing, service signatures and error contracts.
- Visual acceptance follows the team's separately supplied English LTR UI design reference; that private reference is not reproduced or attached here.
