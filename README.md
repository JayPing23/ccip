# CCIP — Campus Communications & Interaction Platform

CCIP is a modular campus platform for three related experiences:

1. Official announcements from university, school, and department offices.
2. Student publication content such as campus news, features, and opinion pieces.
3. A moderated forum where students and faculty can discuss campus issues.

The current codebase implements the shared platform foundation and the official announcements module first. Publication and forum capabilities are planned as additive modules, not as rewrites of the existing announcement system.

---

## Current Status

- Foundation and official announcements are the current implemented product scope.
- Authentication, organizations, roles, admin basics, announcement CRUD, and tests are already in place.
- Announcement management is now content-owned: editors work from `/content/manage`, while super admins can reuse the same workspace from `/admin/content`.
- The next planned work focuses on shared discoverability: notifications, search, preferences, and home/feed improvements.
- Notification and search modules now include Phase 2 scaffolding contracts so runtime work can stay additive instead of growing out of the announcements module.
- Student publication is the next major domain module after that.
- Forum and moderation ship later, together.

---

## Core Documentation

Start with these files:

1. [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md)
   Current status, roadmap alignment, and next recommended work.
2. [CCIP_PROJECT_PROPOSAL.md](CCIP_PROJECT_PROPOSAL.md)
   Full product and architecture source of truth.
3. [SETUP_GUIDE.md](SETUP_GUIDE.md)
   Environment, Supabase, OAuth, and migration setup.
4. [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
   Current API surface for foundation and official announcements.
5. [docs/phase-planning/PHASE_1_CHECKLIST.md](docs/phase-planning/PHASE_1_CHECKLIST.md)
   Foundation and announcements phase record.
6. [docs/phase-planning/PHASE_2_PLAN.md](docs/phase-planning/PHASE_2_PLAN.md)
   Shared discoverability and notifications roadmap.

Additional roadmap detail for later phases lives in `docs/phase-planning/PHASE_3_PLAN.md`, `PHASE_4_PLAN.md`, `PHASE_5_PLAN.md`, and their matching `_AGENT_TASKS` files.

---

## Product Modules

### Current Foundation

- `auth`
- `users`
- `roles`
- `organizations`
- `content` for official announcements
- `admin`
- shared utilities, types, validation, and Supabase clients

### Shared Platform Services

- `notifications`
- `search`
- `media`

### Planned Domain Modules

- `publication`
- `forum`
- `moderation`
- `external_publish`

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Google OAuth credentials for your institutional domain

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill in your environment values.

3. Run the current database migrations described in [SETUP_GUIDE.md](SETUP_GUIDE.md).

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

Note: current setup provisions the platform foundation and official announcements module. Publication and forum tables are future additive migrations.

---

## Repository Structure

```text
app/               Next.js App Router pages and API routes
modules/           Feature and platform modules
shared/            Shared constants, types, utilities, clients, and components
supabase/          SQL migrations
tests/             Unit, integration, and E2E tests
docs/              API reference and phase planning
```

Important current note: `modules/content` is the official announcements module in the current codebase. Publication and forum should be added as separate modules rather than merged into `content`.

Important current note: announcement-specific schemas, constants, services, and management UI now live under `modules/content`, while `shared/` stays focused on platform-level primitives such as permissions, shared shell components, and Supabase clients.

---

## Available Scripts

- `npm run dev` — start the development server
- `npm run build` — build for production
- `npm run type-check` — run TypeScript checks
- `npm run lint` — run ESLint
- `npm run format` — format files with Prettier
- `npm test` — run Jest tests
- `npm run test:watch` — run tests in watch mode
- `npm run test:coverage` — run coverage with thresholds
- `npm run test:e2e` — run Cypress E2E tests

---

## Development Rules

- Keep modules explicit and additive.
- Do not overload the current announcement data model for future publication or forum work.
- Use Zod for request and form validation.
- Keep server-side auth checks on `supabase.auth.getUser()`.
- Keep RLS enabled on all current and future tables.
- Update the proposal, README, and implementation log together when the roadmap changes.

---

## Current Roadmap

1. **Phase 1:** Platform foundation and official announcements.
2. **Phase 2:** Shared discoverability, notifications, search, and experience improvements.
3. **Phase 3:** Student publication module.
4. **Phase 4:** Community forum and moderation.
5. **Phase 5:** Unified campus platform hardening, analytics, and external distribution.

---

## Current API Scope

The current API reference covers:

- authentication,
- users,
- organizations,
- roles,
- official announcements.

Publication and forum endpoint families are planned and will be documented separately when those modules are introduced.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, commit conventions, and collaboration rules.

---

## License

Private repository.

---

*Last updated: March 10, 2026 | CCIP — Campus Communications & Interaction Platform*
