# Blood Donation Network

> **Weekly Mini Project 04 — Team 1**  
> *When a patient needs blood urgently, find the right donors in the right area — fast, and without asking anyone who cannot donate yet.*

---

## Medical Disclaimer

> **Important:** This application **coordinates and matches** emergency volunteer blood donors with hospital requests. It is **not a medical system**. It does not decide whether a person is medically fit to donate and does not replace the medical screening that qualified healthcare staff perform before every donation. The blood-type compatibility table and the 56-day rest period enforced by this platform are program rules used solely to decide **whom to contact**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Prerequisites & Environment Variables](#4-prerequisites--environment-variables)
5. [All Project Commands (Setup, Run, Database & Build)](#5-all-project-commands-setup-run-database--build)
6. [Seeded Demo Credentials & Live Demo Walkthrough](#6-seeded-demo-credentials--live-demo-walkthrough)
7. [Core Business Rules (Backend Source of Truth)](#7-core-business-rules-backend-source-of-truth)
8. [API Overview & Frontend Routes](#8-api-overview--frontend-routes)
9. [Architecture & CSS Rules](#9-architecture--css-rules)
10. [Team Roles, Working Pairs & File Ownership](#10-team-roles-working-pairs--file-ownership)
11. [Git Workflow & Pull Request Rules](#11-git-workflow--pull-request-rules)
12. [Documentation Index](#12-documentation-index)

---

## 1. Project Overview

When a hospital needs blood urgently, staff often post messages on social media and call people one by one. Many respondents have an incompatible blood type, live in another city, or donated recently and are still in their post-donation recovery period. Valuable time is lost.

**Blood Donation Network** solves this by coordinating urgent blood requests across three roles:

- **Public Visitors:** View the live **Public SOS Board** of `OPEN` blood requests ordered by urgency (`CRITICAL` -> `HIGH` -> `NORMAL`) and creation time (oldest first), with zero personal or patient data exposed.
- **Volunteer Donors (`DONOR`):** Sign up, manage their area and availability status, see their calculated eligibility status (`ELIGIBLE`, `REST_PERIOD`, `UNAVAILABLE`, `INACTIVE`) and exact `nextAllowedDonationDate`, view `OPEN` requests they are eligible to help with, pledge to donate (at most one active pledge at a time), and track their donation history.
- **Blood-Bank Coordinators (`COORDINATOR`):** Publish, filter, update, and cancel SOS blood requests; view a ranked list of eligible donors for any open request along with an excluded-donor summary by reason (`restPeriod`, `unavailable`, `inactive`); and record completed donations inside a single **atomic database transaction** (`prisma.$transaction`) that increments collected units, completes the donor's pledge, starts the donor's 56-day rest period, and automatically marks the request `FULFILLED` (releasing remaining pledges) when the unit target is reached.

---

## 2. Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React + TypeScript, Vite, React Router (`react-router-dom`), React Context (`AuthContext`, `DonorContext`, `RequestsContext`), Plain CSS with BEM prefixes & CSS custom properties (`theme.css`) |
| **Backend** | Node.js, NestJS, TypeScript, `class-validator` & `class-transformer` |
| **Database & ORM** | PostgreSQL accessed through Prisma ORM (`schema.prisma`, migrations, `seed.ts`) |
| **Authentication** | JWT (`@nestjs/jwt`, `bcrypt`) with `JwtAuthGuard`, `RolesGuard` (`@Roles('COORDINATOR')`, `@Roles('DONOR')`), and `@Public()` |
| **API Documentation** | Swagger / OpenAPI interactive UI at `/api/docs` |
| **Logging** | Custom NestJS domain logger (`AppLogger`) for request lifecycle and donation events |

### Out of Scope / Forbidden Packages
- **Do not install npm packages without asking the Team Lead (Eyad Ibrahim) first.**
- **Not allowed:** Redux, Zustand, React Query, Tailwind CSS, Bootstrap, Material UI, external maps/location APIs, SMS/email services, WebSockets, Docker, or cloud deployment.

---

## 3. Repository Structure

```text
blood-donation-network/
├── api/                        # NestJS Backend + Prisma ORM
│   ├── prisma/
│   │   ├── migrations/         # Committed SQL migrations
│   │   ├── schema.prisma       # PostgreSQL schema
│   │   └── seed.ts             # Seed script (6 areas, 2 coordinators, 24 donors, 6 requests)
│   ├── src/
│   │   ├── common/             # Constants, ClockService, AppLogger, Validators, Pipe, ExceptionFilter
│   │   ├── prisma/             # Global PrismaModule & PrismaService
│   │   ├── auth/               # JWT sign-up, sign-in, me, Guards & Decorators
│   │   ├── areas/              # Supported geographic areas
│   │   ├── matching/           # Central MatchingService (compatibility, rest period, ranking)
│   │   ├── requests/           # SOS board, request CRUD, cancel, eligible-donors endpoint
│   │   ├── donations/          # Atomic donation recording (prisma.$transaction)
│   │   ├── donors/             # Donor profile, availability, deactivation, eligible-requests
│   │   ├── pledges/            # Create pledge & withdraw pledge
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── requests/
│   │   └── api.http            # 25 runnable REST Client tests covering all scenarios
│   ├── .env.example
│   └── package.json
├── client/                     # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Loading, ErrorMessage, EmptyState, Button, Badges, PageContainer
│   │   │   └── layout/         # Layout, Navbar, ProtectedRoute
│   │   ├── context/            # AuthContext, DonorContext, RequestsContext
│   │   ├── pages/              # SosBoard, SignIn, SignUp, DonorDashboard, DonorProfile,
│   │   │                       # Requests, RequestDetails, EligibleDonors, NotFound
│   │   ├── routes/             # AppRouter.tsx
│   │   ├── services/           # http.ts, auth.api.ts, donors.api.ts, pledges.api.ts, requests.api.ts
│   │   ├── types/              # auth.types.ts, donor.types.ts, request.types.ts
│   │   ├── utils/              # format.ts, date.ts
│   │   ├── styles/             # theme.css, global.css
│   │   ├── constants.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── docs/                       # Team Contracts & Specifications
│   ├── API.md                  # Full REST API contract, DTO orders & error messages
│   ├── PROJECT-STRUCTURE.md    # Architecture, schema, types, contexts & CSS rules
│   └── TASKS.md                # Individual member tasks, test tables & workflow
├── .github/
│   ├── CODEOWNERS
│   └── pull_request_template.md
└── README.md
```

---

## 4. Prerequisites & Environment Variables

### Prerequisites
Make sure you have the following installed on your machine:
1. **Node.js** (v18 LTS or v20+ recommended) & **npm**
2. **PostgreSQL** (v14+ running locally on port `5432`)
3. **Git** and **VS Code** (with the *REST Client* extension recommended for running `api/requests/api.http`)

### 1. Backend Environment (`api/.env`)
Copy `api/.env.example` to `api/.env`:

```bash
cp api/.env.example api/.env
```

Update `api/.env` with your local PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blood_donation_network?schema=public"
JWT_SECRET="super-secret-blood-donation-jwt-key-change-in-prod"
JWT_EXPIRES_IN="7d"
PORT=3000
```

> **Note:** Replace `postgres:postgres` with your local PostgreSQL username and password if different. Prisma will automatically create the `blood_donation_network` database when you run `npx prisma migrate dev`.

### 2. Frontend Environment (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

Verify `client/.env` contains:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 5. All Project Commands (Setup, Run, Database & Build)

### Step-by-Step First-Time Setup

Open a terminal at the root of the repository and run:

```bash
# 1. Install Backend dependencies
cd api
npm install

# 2. Generate Prisma Client, apply PostgreSQL migrations, and seed initial data
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 3. Install Frontend dependencies
cd ../client
npm install
```

---

### Running the Application Locally (Two Terminals)

#### Terminal 1 — Start the Backend (`api/`)

```bash
cd api
npm run start:dev
```

- **API Base URL:** `http://localhost:3000/api`
- **Swagger / OpenAPI Docs:** `http://localhost:3000/api/docs`

#### Terminal 2 — Start the Frontend (`client/`)

```bash
cd client
npm run dev
```

- **Frontend App URL:** `http://localhost:5173`

---

### Complete Command Reference for Team Members

#### Backend & Prisma Commands (run inside `api/`)

| Action | Command | When to use |
| --- | --- | --- |
| Start backend in watch mode | `npm run start:dev` | Daily local development |
| Build backend & check TS types | `npm run build` | Always run before opening a PR |
| Apply migrations to local DB | `npx prisma migrate dev` | After pulling `main` or setting up DB |
| Seed database with demo data | `npx prisma db seed` | Populate areas, coordinators, donors & requests |
| **Reset DB + re-migrate + re-seed** | `npx prisma migrate reset` | **Best command before testing or demoing** (wipes DB and runs seed automatically) |
| Regenerate Prisma Client types | `npx prisma generate` | If `@prisma/client` types feel out of sync |
| Open Prisma Studio (DB GUI) | `npx prisma studio` | Inspect PostgreSQL tables in browser at `http://localhost:5555` |
| Validate Prisma schema | `npx prisma validate` | Verify `schema.prisma` syntax |

#### Frontend Commands (run inside `client/`)

| Action | Command | When to use |
| --- | --- | --- |
| Start Vite dev server | `npm run dev` | Daily local development (`http://localhost:5173`) |
| Type-check & production build | `npm run build` | Always run before opening a PR to catch TypeScript errors |
| Preview production build | `npm run preview` | Test built frontend bundle locally |

---

## 6. Seeded Demo Credentials & Live Demo Walkthrough

Running `npx prisma db seed` (or `npx prisma migrate reset`) inside `api/` populates:
- **6 Supported Areas:** `Homs`, `Damascus`, `Aleppo`, `Latakia`, `Hama`, `Tartus`
- **2 Coordinator Accounts**
- **24 Volunteer Donor Accounts** covering all 8 blood types (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`), including eligible donors, donors in their 56-day rest period, unavailable donors, and an inactive donor
- **6 Blood Requests** across `OPEN`, `FULFILLED`, and `CANCELLED` states

### Seeded Accounts for Testing & Presentation

| Role | Name / Description | Email / Phone (`identifier`) | Password | Blood Type & Area | Initial State |
| --- | --- | --- | --- | --- | --- |
| **Coordinator** | Homs Blood Bank Coordinator | `coordinator.homs@bloodnet.sy` or `0911000001` | `Coordinator123!` | — | Active Coordinator |
| **Coordinator** | Damascus Coordinator | `coordinator.damascus@bloodnet.sy` or `0911000002` | `Coordinator123!` | — | Active Coordinator |
| **Donor** | **Sara Al-Khatib** (Scenario Hero) | `sara@example.com` or `0933112233` | `DonorPassword123` | `A-` · `Homs` | `ELIGIBLE` (active, available, no recent donation) |
| **Donor** | **Rami** (Scenario Rest Period) | `0933000002` (see `seed.ts`) | `DonorPassword123` | `O-` · `Homs` | `REST_PERIOD` (donated 20 days ago; excluded from matching) |
| **Donor** | **Omar Mansour** | `0944556677` (see `seed.ts`) | `DonorPassword123` | `O-` · `Homs` | `ELIGIBLE` (compatible with `A-`, older donation) |

### End-to-End Demo Walkthrough (Section 6 Scenario)

1. **Public SOS Board (`/`):** Open `http://localhost:5173` without signing in. Observe the `CRITICAL` `A-` request (3 units, Homs, Central Blood Bank Homs) listed first with zero patient references or personal data.
2. **Coordinator Eligible Donors (`/coordinator/requests/:id/eligible-donors`):** Sign in as the Homs Coordinator (`coordinator.homs@bloodnet.sy` / `Coordinator123!`). Open the Homs `A-` request and click **Eligible Donors**.
   - **Sara (`A-`)** ranks above **Omar (`O-`)** because exact blood-type matches come first (`R-7`).
   - **Rami (`O-`)** is not in the list because he donated 20 days ago, and the **Excluded Donors Summary** shows `1` under **In Rest Period** (`R-8`).
3. **Donor Pledge (`/donor/dashboard`):** Sign in as **Sara** (`0933112233` / `DonorPassword123`). Her dashboard shows a green `ELIGIBLE` banner and the `CRITICAL` Homs `A-` request under **Requests I Can Help With**. Click **Pledge to Donate**. Her active pledge card appears immediately.
4. **Record Completed Donation (`/coordinator/requests/:id`):** Sign back in as the Coordinator, open the Homs `A-` request, see Sara's `PLEDGED` pledge, and click **Record Donation**.
   - Inside one `prisma.$transaction`, the request updates to **1 of 3 units collected** (`2 still needed`), Sara's pledge becomes `COMPLETED`, and Sara enters a **56-day rest period** (`nextAllowedDonationDate = donationDate + 56 days`).
5. **Automatic Fulfillment:** Record the remaining 2 units from other eligible donors. When the 3rd unit is recorded, the request automatically transitions to `FULFILLED`, disappears from the Public SOS Board, and any remaining `PLEDGED` pledges are set to `RELEASED`.

---

## 7. Core Business Rules (Backend Source of Truth)

The backend (`api/`) is the sole source of truth for all business rules. The frontend (`client/`) never duplicates compatibility tables, 56-day date math, or eligibility filtering.

### 1. Red-Cell Blood-Type Compatibility (`R-1`, `R-2`)
Defined once in `api/src/common/constants.ts` and evaluated by `MatchingService`:

| Blood Type Needed (Request) | Compatible Donor Blood Types |
| --- | --- |
| `O-` | `O-` |
| `O+` | `O+`, `O-` |
| `A-` | `A-`, `O-` |
| `A+` | `A+`, `A-`, `O+`, `O-` |
| `B-` | `B-`, `O-` |
| `B+` | `B+`, `B-`, `O+`, `O-` |
| `AB-` | `AB-`, `A-`, `B-`, `O-` |
| `AB+` | `AB+`, `AB-`, `A+`, `A-`, `B+`, `B-`, `O+`, `O-` |

### 2. Post-Donation Rest Period (`R-3` – `R-5`)
- Configured in a single constant: `REST_PERIOD_DAYS = 56` in `api/src/common/constants.ts`.
- $\text{nextAllowedDonationDate} = \text{lastDonationDate} + 56\text{ days}$.
- While $\text{today} < \text{nextAllowedDonationDate}$, the donor's status is `REST_PERIOD`. A donor with `lastDonationDate === null` has no rest period.

### 3. Donor Eligibility, Ranking & Excluded Summary (`R-6` – `R-8`)
- A donor is **eligible** for a request only if **all 5 conditions** hold:
  1. `user.isActive === true`
  2. `donor.isAvailable === true`
  3. Not in rest period (`!isInRestPeriod`)
  4. `donor.bloodType` is compatible with `request.bloodType`
  5. `donor.areaId === request.areaId`
- **Ranking Order (`R-7`):**
  1. Exact blood-type match (`donor.bloodType === request.bloodType`) before other compatible types
  2. Longest time since last donation (`lastDonationDate === null` first, then oldest `lastDonationDate` ascending)
  3. Alphabetical by `fullName`
- **Excluded Summary (`R-8`):** Compatible donors in the same area who cannot donate are counted under `{ restPeriod, unavailable, inactive }` without exposing their personal data.

### 4. Request Lifecycle & Pledges (`R-9` – `R-18`)
- Requests have status `OPEN`, `FULFILLED`, or `CANCELLED`. Only `OPEN` requests can be updated, cancelled, matched, pledged to, or receive donations (`409 Conflict` otherwise).
- $\text{unitsStillNeeded} = \max(0, \text{unitsRequired} - \text{unitsCollected})$.
- `unitsRequired` (integer $1\text{–}10$) cannot be reduced below `unitsCollected` (`400 Bad Request`).
- Duplicate `OPEN` requests with the same `patientReference` and `bloodType` are rejected (`409 Conflict`).
- A donor can hold **at most one active (`PLEDGED`) pledge** across all requests (`409 Conflict`).
- Active `PLEDGED` pledges on a request cannot exceed `unitsStillNeeded` (`409 Conflict`).
- When a request becomes `FULFILLED` or `CANCELLED`, all remaining `PLEDGED` pledges automatically become `RELEASED`.

### 5. Atomic Donation Transaction (`R-19` – `R-22`)
Recording a donation (`POST /api/requests/:id/donations`) executes inside a single `prisma.$transaction`:
1. Creates a 1-unit `Donation` record (`donationDate` cannot be in the future).
2. Increments `request.unitsCollected` by `1`.
3. Marks the donor's active `PLEDGED` pledge on this request (if any) as `COMPLETED`.
4. Updates the donor's `lastDonationDate` (starting their 56-day rest period).
5. If `unitsCollected === unitsRequired`, marks the request `FULFILLED` and updates all remaining `PLEDGED` pledges on that request to `RELEASED`.
6. If any step fails, PostgreSQL rolls back the entire transaction so nothing is saved.

---

## 8. API Overview & Frontend Routes

### REST API Endpoints (`http://localhost:3000/api`)

| Method | Endpoint | Access / Role | Purpose | Owner |
| --- | --- | --- | --- | --- |
| `GET` | `/areas` | `@Public()` | List all supported areas | Eyad |
| `POST` | `/auth/sign-up` | `@Public()` | Register a new volunteer donor account | Eyad |
| `POST` | `/auth/sign-in` | `@Public()` | Sign in as Coordinator or Donor and receive JWT | Eyad |
| `GET` | `/auth/me` | Authenticated | Get current signed-in user profile | Eyad |
| `GET` | `/requests/sos` | `@Public()` | List `OPEN` requests for public SOS board (public fields only) | Adham |
| `POST` | `/requests` | `COORDINATOR` | Publish a new `OPEN` SOS blood request | Adham |
| `GET` | `/requests` | `COORDINATOR` | List all requests with optional filters (`status`, `bloodType`, `areaId`, `urgency`) | Adham |
| `GET` | `/requests/:id` | `COORDINATOR` | Get full details of one request (counters, pledges, donations) | Adham |
| `PATCH` | `/requests/:id` | `COORDINATOR` | Update an `OPEN` request's `unitsRequired`, `urgency`, and `note` | Adham |
| `PATCH` | `/requests/:id/cancel` | `COORDINATOR` | Cancel an `OPEN` request with a reason and release active pledges | Adham |
| `GET` | `/requests/:id/eligible-donors` | `COORDINATOR` | Get ranked eligible donors and excluded-donor summary | Adham + Eyad |
| `POST` | `/requests/:id/donations` | `COORDINATOR` | Record a completed 1-unit donation in a DB transaction | Adham + Eyad |
| `GET` | `/donors/me` | `DONOR` | Get own donor profile, eligibility status, next allowed date, active pledge & history | Laith + Eyad |
| `PATCH` | `/donors/me` | `DONOR` | Update own `areaId`, `phone`, and `isAvailable` flag | Laith |
| `PATCH` | `/donors/me/deactivate` | `DONOR` | Deactivate own account and withdraw active pledge | Laith |
| `GET` | `/donors/me/eligible-requests` | `DONOR` | List `OPEN` requests the signed-in donor is eligible to help with | Laith + Eyad |
| `GET` | `/donors` | `COORDINATOR` | List all donors with their eligibility status | Laith |
| `POST` | `/requests/:id/pledges` | `DONOR` | Pledge to donate to an eligible `OPEN` request | Laith + Eyad |
| `PATCH` | `/pledges/:id/withdraw` | `DONOR` | Withdraw own active `PLEDGED` pledge | Laith |

> **Testing the API:** Open `api/requests/api.http` in VS Code to run all 25 test cases covering every success and validation/error scenario.

### Frontend Routes (`http://localhost:5173`)

| Route | Screen | Access / Role | Owner |
| --- | --- | --- | --- |
| `/` | `SosBoardPage` | Everyone (Public) | Molham |
| `/sign-in` | `SignInPage` | Everyone (Public) | Molham |
| `/sign-up` | `SignUpPage` | Everyone (Public — Donor registration) | Molham |
| `/donor/dashboard` | `DonorDashboardPage` | `DONOR` | Taymaa |
| `/donor/profile` | `DonorProfilePage` | `DONOR` | Taymaa |
| `/coordinator/requests` | `RequestsPage` | `COORDINATOR` | Rami |
| `/coordinator/requests/:requestId` | `RequestDetailsPage` | `COORDINATOR` | Rami |
| `/coordinator/requests/:requestId/eligible-donors` | `EligibleDonorsPage` | `COORDINATOR` | Rami |
| `*` | `NotFoundPage` | Everyone | Molham |

---

## 9. Architecture & CSS Rules

1. **Backend Architecture (`Controller -> Service -> Persistence`):**
   - Controllers contain **zero** business rules and **zero** `PrismaService` calls.
   - Always use `ClockService.now()` instead of `new Date()` for business comparisons.
   - Every error response returns `{ "message": "Human-readable reason." }` via `AllExceptionsFilter`.
2. **Frontend Context Architecture:**
   - Pages and components **never** call `fetch` or `client/src/services/*.api.ts` directly. Only `AuthContext`, `DonorContext`, and `RequestsContext` call the API service layer.
   - Every screen that loads data must display a `Loading` state, an `EmptyState` when lists are empty, and an `ErrorMessage` with retry when a request fails.
   - Validation and business-rule errors from the backend are always displayed inline next to the form.
3. **CSS Variables & BEM Prefix Discipline:**
   - Never write hardcoded hex or RGB colors in component/page CSS files. Use only CSS variables from `client/src/styles/theme.css`.
   - Every CSS class must start with its owner's BEM prefix:
     - `sos-board-`, `sign-in-`, `sign-up-`, `not-found-`, `ui-` (**Molham**)
     - `donor-dashboard-`, `donor-profile-` (**Taymaa**)
     - `requests-`, `request-details-`, `eligible-donors-` (**Rami**)
     - `layout-`, `ui-` (**Eyad**)

---

## 10. Team Roles, Working Pairs & File Ownership

### Team & Working Pairs

| Member | Role / Area | Main Responsibilities |
| --- | --- | --- |
| **Eyad Ibrahim** *(Team Lead)* | Backend & Foundation | Phase 0 Foundation, Prisma Schema & Seed, `common/` (Constants, Validators, Pipe, Filter, `AppLogger`), `AuthModule`, `AreasModule`, central `MatchingService`, Frontend Layout/`ProtectedRoute`, PR Reviews |
| **Adham Albasha** | Backend | `RequestsModule` (`sos`, CRUD, `cancel`, `eligible-donors`), `DonationsModule` (`prisma.$transaction`), Domain Logging |
| **Laith Haj Hosin** | Backend | `DonorsModule` (`/donors/me`, `eligible-requests`, `/donors`), `PledgesModule` (`create`, `withdraw`), REST Client Test Suite (`api/requests/api.http`) |
| **Molham Al Kasir** | Frontend | Shared UI Components (`components/common/`) & Utils (`format.ts`, `date.ts`), `AuthContext`, `SosBoardPage`, `SignInPage`, `SignUpPage`, `NotFoundPage` |
| **Taymaa Watfeh** | Frontend | `DonorContext`, `DonorDashboardPage` (`EligibilityBanner`, `ActivePledgeCard`, `EligibleRequestsList`, `DonationHistoryTable`), `DonorProfilePage` |
| **Rami** | Frontend | `RequestsContext`, `RequestsPage` (Filters & Create Modal), `RequestDetailsPage` (Update, Cancel, Record Donation), `EligibleDonorsPage` (Ranked List & Excluded Summary) |

### File Ownership Summary (Stay in Your Lane)

Every file has **one owner**. Never edit another member's files without asking first:

- **Eyad:** `api/prisma/**`, `api/src/main.ts`, `api/src/app.module.ts`, `api/src/prisma/**`, `api/src/common/**`, `api/src/auth/**`, `api/src/areas/**`, `api/src/matching/**`, `client/src/App.tsx`, `client/src/main.tsx`, `client/src/routes/**`, `client/src/styles/**`, `client/src/components/layout/**`, `client/src/components/common/PageContainer*`, `client/src/services/http.ts`, `docs/**`, `README.md`
- **Adham:** `api/src/requests/**`, `api/src/donations/**`
- **Laith:** `api/src/donors/**`, `api/src/pledges/**`, `api/requests/api.http`
- **Molham:** `client/src/pages/SosBoard/**`, `client/src/pages/SignIn/**`, `client/src/pages/SignUp/**`, `client/src/pages/NotFound/**`, `client/src/context/AuthContext.tsx`, `client/src/services/auth.api.ts`, `client/src/types/auth.types.ts`, `client/src/components/common/{Loading,ErrorMessage,EmptyState,Button,StatusBadge,UrgencyBadge,BloodTypeBadge}*`, `client/src/utils/**`, `client/src/constants.ts`
- **Taymaa:** `client/src/pages/DonorDashboard/**`, `client/src/pages/DonorProfile/**`, `client/src/context/DonorContext.tsx`, `client/src/services/donors.api.ts`, `client/src/services/pledges.api.ts`, `client/src/types/donor.types.ts`
- **Rami:** `client/src/pages/Requests/**`, `client/src/pages/RequestDetails/**`, `client/src/pages/EligibleDonors/**`, `client/src/context/RequestsContext.tsx`, `client/src/services/requests.api.ts`, `client/src/types/request.types.ts`

---

## 11. Git Workflow & Pull Request Rules

### 1. Starting a New Task Branch
**Never work on or push directly to `main`.** Always run these commands before starting a task:

```bash
git switch main
git pull origin main
git switch -c <be|fe>/<module-or-page>-<short-description>
git branch --show-current   # Verify this does NOT print "main"
```

Examples of valid branch names:
- `be/requests-crud-and-cancel`
- `be/donations-transaction`
- `be/pledges-module`
- `fe/shared-ui-and-utils`
- `fe/donor-dashboard-page`
- `fe/eligible-donors-page`

### 2. Commit Message Convention
Use Conventional Commits: `type(scope): message` (`feat`, `fix`, `refactor`, `style`, `docs`, `chore`):

```bash
git status                  # Verify you only touched files you own
git add <your-owned-files>
git commit -m "feat(donations): record donation atomically inside prisma transaction"
```

### 3. Syncing with `main` & Opening a Pull Request
Before pushing and opening a Pull Request, sync with `origin/main` and verify both apps build cleanly:

```bash
# 1. Fetch and merge latest main into your feature branch
git fetch origin
git merge origin/main

# 2. Verify backend & frontend compile with zero TypeScript errors
cd api && npm run build
cd ../client && npm run build

# 3. Push your branch
git push -u origin HEAD
```

### 4. Pre-Merge Checklist
- [ ] I am on a feature branch (`be/...` or `fe/...`), not `main`.
- [ ] I modified **only** files I own (`docs/TASKS.md`, section 4).
- [ ] All endpoint paths, DTO property orders, and error messages match `docs/API.md` verbatim.
- [ ] Controllers have zero business rules and zero Prisma queries.
- [ ] Frontend pages use Context hooks (`useAuth`, `useDonor`, `useRequests`) and handle loading, empty, and error states.
- [ ] CSS uses only variables from `theme.css` and my assigned BEM prefix.
- [ ] Both `api` (`npm run build`) and `client` (`npm run build`) compile cleanly.

---

## 12. Documentation Index

For detailed specifications, always consult the `docs/` folder:

- **[`docs/API.md`](./docs/API.md):** Complete REST API contract, request/response JSON shapes, DTO validation property orders, exact error status codes/messages, and the 25-item testing checklist.
- **[`docs/PROJECT-STRUCTURE.md`](./docs/PROJECT-STRUCTURE.md):** Prisma schema design, module dependency graph, fixed service/controller method signatures, React Context interfaces, TypeScript types, and CSS theme variables.
- **[`docs/TASKS.md`](./docs/TASKS.md):** Individual member tasks, step-by-step implementation guides, unit/integration test tables, and the final English presentation breakdown.