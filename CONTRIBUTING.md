# Contributing to CCIP

## Branch Strategy

```
main          ← Production-ready code only. Protected branch.
dev           ← Integration branch. All features merge here first.
feature/*     ← Feature branches. e.g. feature/content-creation
hotfix/*      ← Emergency fixes to main. e.g. hotfix/auth-bypass
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-org posting to content form
fix: correct RLS policy for DEPT_ONLY visibility
docs: update API design documentation
test: add unit tests for permissions utils
refactor: extract permission check functions
chore: update Supabase client to v2.39
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make commits following Conventional Commits
3. Push to GitHub: `git push origin feature/my-feature`
4. Open a PR targeting `dev` branch
5. CI must pass (TypeScript, ESLint, unit tests)
6. At least 1 approval required
7. Merge via GitHub (squash commits if messy)

## Code Quality Standards

- TypeScript strict mode: zero `any` types
- No console.log in production code
- All public functions have JSDoc comments
- Min 70% test coverage for service files
- All API routes return standardized response format

## Before Committing

```bash
npm run type-check    # Zero errors required
npm run lint          # Zero errors required
npm run format        # Format code
npm test              # All tests pass
```

## Adding a New Module

1. Create folder structure under `modules/my-module/`
2. Create service file: `modules/my-module/my-module.service.ts`
3. Create types file: `modules/my-module/types/my-module.types.ts`
4. Create API routes as needed: `modules/my-module/api/*.ts`
5. Create React components: `modules/my-module/components/*.tsx`
6. Create hooks: `modules/my-module/hooks/*.ts`
7. Create tests: `modules/my-module/**/*.test.ts`

## Phasing

- Do not implement Phase N+ features while in Phase N-1
- Use `// TODO: Phase N` comments for deferred features
- Complete Definition of Done for current phase before moving to next

## Questions?

See `CCIP_PROJECT_PROPOSAL.md` for architecture, naming conventions, and coding rules.

---

*CCIP Contributing Guide | Last Updated: March 4, 2026*
