# CCIP — Centralized Campus Information Portal

A secure, role-based web platform that centralizes all official university communications into one place.

---

## 📖 CORE DOCUMENTATION - 5 FILES ONLY

This project uses **just 5 core documentation files**. Everything you need is in one of these:

### 1. **[IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md)** ⭐ START HERE
**When:** Every new session | **Read time:** 5 min | **Purpose:** Current status & next steps
- What's complete ✅
- What's in progress 🔄
- What's next ⏳
- How to resume work
- Architecture decisions

### 2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)**
**When:** First time setup | **Read time:** 30 min | **Purpose:** Get project running
- Supabase configuration
- Google OAuth setup
- Database migrations
- Environment variables
- Verification steps

### 3. **[CCIP_PROJECT_PROPOSAL.md](CCIP_PROJECT_PROPOSAL.md)**
**When:** Understanding "why" | **Read time:** 30 min (reference) | **Purpose:** Full architecture & design
- System design & architecture
- Database schema
- Permission model
- Naming conventions
- All feature specifications
- Technology stack decisions

### 4. **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)**
**When:** Building features | **Read time:** 10 min (reference) | **Purpose:** All 17 API endpoints
- Request/response examples
- Error codes
- Permission rules
- Testing with cURL

### 5. **[docs/phase-planning/PHASE_1_CHECKLIST.md](docs/phase-planning/PHASE_1_CHECKLIST.md)**
**When:** Planning work | **Read time:** 5 min | **Purpose:** Phase 1 task list
- Completed tasks ✅
- In progress 🔄
- Not started ❌
- Time estimates

---

## 🚀 QUICK START (2 Minutes)

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier)
- Google OAuth credentials for institutional domain

### Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill in your Supabase and Google OAuth credentials:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your keys
   ```

3. Run database migrations (see PRE_PHASE_1_SETUP.md):
   - Create all 11 SQL migrations in Supabase
   - Seed the initial organizations and SUPER_ADMIN user

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/               - Next.js App Router pages and routes
modules/           - Feature modules (content, users, auth, etc.)
shared/            - Shared constants, types, utils, components
supabase/          - Database migrations
tests/             - Unit, integration, and E2E tests
```

For detailed architecture and design decisions, see `CCIP_PROJECT_PROPOSAL.md`.

## Development

### Available Scripts

- `npm run dev` — Start dev server at http://localhost:3000
- `npm run build` — Build for production
- `npm run type-check` — Run TypeScript compiler (zero errors required)
- `npm run lint` — Run ESLint
- `npm run format` — Format code with Prettier
- `npm test` — Run Jest unit tests
- `npm run test:watch` — Re-run tests on file changes
- `npm run test:coverage` — Generate coverage report
- `npm run test:e2e` — Run Cypress E2E tests

### TypeScript

This project uses **strict mode**. All code must be fully typed. The `tsconfig.json` enforces:
- `strict: true` — All TypeScript checks enabled
- `noUnusedLocals: true` — Unused variables cause errors
- `noUnusedParameters: true` — Unused parameters cause errors
- `noImplicitReturns: true` — All code paths must return a value

### Code Style

Code is automatically formatted with Prettier on save (via VS Code settings). ESLint catches style violations.

To format all files:
```bash
npm run format
```

### Database Migrations

All schema changes go in `supabase/migrations/`. Run migrations via Supabase dashboard or CLI:

```bash
supabase migration up
```

Never modify the schema manually in production.

## Authentication

Users log in with their institutional Google account. The domain is restricted to `INSTITUTIONAL_DOMAIN` environment variable.

- **Client:** Supabase Auth + Google OAuth 2.0
- **Server-side validation:** Email domain checked on every auth callback
- **RLS (Row Level Security):** All data access is controlled at the database level

## API Design

All API endpoints follow this format:

```typescript
// Request
POST /api/content
{ "title": "...", "body": "...", ... }

// Response (success)
{
  "data": { "id": "...", ... },
  "error": null
}

// Response (error)
{
  "data": null,
  "error": { "message": "...", "code": "VALIDATION_ERROR" }
}
```

See `CCIP_PROJECT_PROPOSAL.md` Section 21 for full API design rules.

## Phase Progress

- **Phase 1** — MVP Core (In Progress)
- **Phase 2** — Notifications & Search (Planned)
- **Phase 3** — Rich Content & Media (Planned)
- **Phase 4** — Admin & Publications (Planned)
- **Phase 5** — External Social Media (Planned)

For Phase definitions and requirements, see `CCIP_PROJECT_PROPOSAL.md` Section 18.

## Contributing

See `CONTRIBUTING.md` for branch strategy, commit conventions, and pull request process.

## License

Private. See repo settings for access.

---

*CCIP Project v2.0 | Centralized Campus Information Portal | Last Updated: March 8, 2026*
