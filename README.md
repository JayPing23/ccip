# CCIP — Campus Communications & Interaction Platform

CCIP is a modular campus platform for three related experiences:

1. Official announcements from university, school, and department offices.
2. Student publication content such as campus news, features, and opinion pieces.
3. A moderated forum where students and faculty can discuss campus issues.

The current codebase implements the shared platform foundation, the official announcements module, the Phase 2 shared discoverability layer, the Phase 3 student publication module, and the Phase 4 community forum and moderation module. External distribution capabilities remain planned as an additive module.

---

## Current Status

- Foundation, official announcements, and the shared portal shell are implemented.
- Authentication, organizations, roles, admin basics, announcement CRUD, and announcement management are in place.
- Notifications are live: unread badge, notification center, mark-read flows, and per-organization preferences.
- Search and discoverability are live: PostgreSQL full-text search support, `/api/search`, URL-driven filters, dashboard quick search, recent announcements, and a searchable feed.
- Immediate publish emails and daily/weekly digests are implemented; they require the email and cron environment variables documented in `.env.example`.
- User-based rate limiting protects announcement create and publish actions, and targeted tests now exist for notifications, search helpers, digests, and rate limiting.
- Student publication module is implemented: article CRUD, editorial workflow, campus news pages, notifications, and search integration.
- Forum module is implemented: categories, threads, replies, reactions, reporting, notifications, search, and rate limiting.
- Moderation module is implemented: report queue, moderation actions, user restrictions, and moderator-only access.

---

## Core Documentation

Start with these files:

1. [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md)
   Current delivery position, implementation truth, and the next recommended entry point.
2. [docs/CCIP_PROJECT_PROPOSAL.md](docs/CCIP_PROJECT_PROPOSAL.md)
   Full product and architecture source of truth.
3. [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)
   Environment, Supabase, OAuth, and foundation migration setup.
4. [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
   Current API surface for announcements, notifications, search, digest, forum, and moderation routes.
5. [docs/phase-planning/PHASE_1_CHECKLIST.md](docs/phase-planning/PHASE_1_CHECKLIST.md)
   Foundation and announcements phase record.
6. [docs/phase-planning/PHASE_2_PLAN.md](docs/phase-planning/PHASE_2_PLAN.md)
   Shared discoverability and notifications roadmap that now matches the implemented runtime.

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

### Implemented Shared Platform Services

- `notifications`
- `search`
- `media`

### Implemented Domain Modules (Phase 3)

- `publication` — campus news articles with editorial workflow

### Implemented Domain Modules (Phase 4)

- `forum` — community threads, replies, reactions, reporting, with rate limiting and search
- `moderation` — report queue, moderation actions, user restrictions

### Planned Domain Modules

- `external_publish`

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Google OAuth credentials for your institutional domain
- Resend account credentials if you want email delivery and digests enabled

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill in your environment values.

   If you want Phase 2 email delivery and digests, also set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CRON_SECRET`.

3. Run the foundation migrations described in [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md), and apply the SQL files under [supabase/migrations](supabase/migrations) in order. The current runtime expects [supabase/migrations/002_content_full_text_search.sql](supabase/migrations/002_content_full_text_search.sql), [supabase/migrations/003_fix_content_update_policy.sql](supabase/migrations/003_fix_content_update_policy.sql), and [supabase/migrations/004_add_content_tags.sql](supabase/migrations/004_add_content_tags.sql).

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

Note: current setup provisions the platform foundation, official announcements, notifications, search, shared discoverability, the student publication module, and the forum and moderation module. Apply all SQL files under `supabase/migrations` in order.

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

Important current note: `modules/content` is the official announcements module in the current codebase. Publication, forum, and moderation are separate modules and should not be merged into `content`.

Important current note: announcement-specific schemas, constants, services, and management UI now live under `modules/content`, while `shared/` stays focused on platform-level primitives such as permissions, shared shell components, notifications, search, and Supabase clients.

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
- `npm run test:e2e:headless` — run Cypress E2E tests in headless mode
- `npm run test:e2e:publish` — start a local app and run the headless content publish smoke test
- `npm run test:e2e:publish:only` — run the headless content publish smoke test against an already-running app

### Publish Smoke Test

The publish smoke test logs in with a seeded editor account, creates a new draft announcement,
publishes it from the management workspace, and verifies that it appears in the announcement
feed.

Credential environment variables are optional.

If `CYPRESS_E2E_USER_EMAIL` and `CYPRESS_E2E_USER_PASSWORD` are set, Cypress uses them.
If they are omitted, the smoke test seeds a local `DEPT_EDITOR` account automatically through a
development-only route and signs in with that account.

Optional environment variables:

- `CYPRESS_BASE_URL` — defaults to `http://127.0.0.1:3000`
- `CYPRESS_E2E_PUBLISH_SMOKE_TITLE_PREFIX` — defaults to `Cypress Publish Smoke`
- `CYPRESS_E2E_PUBLISH_SMOKE_BODY` — overrides the default smoke-test body text
- `E2E_EDITOR_EMAIL` — overrides the default local seeded editor email
- `E2E_EDITOR_PASSWORD` — overrides the default local seeded editor password
- `E2E_EDITOR_DISPLAY_NAME` — overrides the default local seeded editor display name

`npm run test:e2e:publish` starts the app automatically on `http://127.0.0.1:3000`, waits for `/login`, runs the smoke test, and then shuts the app down.

Use this when you want the single-command local or CI flow:

```bash
npm run test:e2e:publish
```

If you already have the app running, or you need to point Cypress at another URL via `CYPRESS_BASE_URL`, use:

```bash
npm run test:e2e:publish:only
```

### Cypress Cloud GitHub Actions

The repo is configured for Cypress Cloud with project ID `ezz7q3`.

Required GitHub Actions secrets:

- `CYPRESS_RECORD_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional GitHub Actions secrets:

- `NEXT_PUBLIC_INSTITUTIONAL_DOMAIN`
- `E2E_EDITOR_EMAIL`
- `E2E_EDITOR_PASSWORD`
- `E2E_EDITOR_DISPLAY_NAME`

The workflow file is `.github/workflows/cypress.yml` and records the publish smoke test to Cypress Cloud on push.

---

## Development Rules

- Keep modules explicit and additive.
- Do not overload the current announcement data model for future publication or forum work.
- Use Zod for request and form validation.
- Keep server-side auth checks on `supabase.auth.getUser()`.
- Keep RLS enabled on all current and future tables.
- Update the proposal, README, API reference, and implementation log together when the roadmap or implementation boundary changes.

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
- official announcements,
- notifications and notification preferences,
- search,
- digest cron utilities,
- forum (categories, threads, replies, reactions, reports),
- moderation (queue, actions, restrictions).

Publication, forum, and moderation endpoint families are now documented in the API reference.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, commit conventions, and collaboration rules.

---

## License

Private repository.

---

*Last updated: March 10, 2026 | CCIP — Campus Communications & Interaction Platform*
