# CCIP — VS Code Setup Guide
> Complete setup for a modular campus platform covering official announcements, student publication, and community discussion

---

## TABLE OF CONTENTS

1. [Extensions to Install](#1-extensions-to-install)
2. [VS Code Settings](#2-vs-code-settings)
3. [Project Folder Setup](#3-project-folder-setup)
4. [Workspace File](#4-workspace-file)
5. [Recommended Snippets](#5-recommended-snippets)
6. [First-Time Checklist](#6-first-time-checklist)

---

## 1. Extensions to Install

Install these from the VS Code Extensions panel (`Ctrl+Shift+X`).

### 🔵 Essential — Install These First

| Extension | Extension ID | Why You Need It |
|---|---|---|
| **ESLint** | `dbaeumer.vscode-eslint` | Catches code errors and enforces rules in real time |
| **Prettier** | `esbenp.prettier-vscode` | Auto-formats code on save |
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind classes |
| **TypeScript Importer** | `pmneo.tsimporter` | Auto-imports TypeScript types and modules |
| **Supabase** | `supabase.vscode-supabase` | Supabase schema explorer and query helper |
| **Prisma / SQL** | `inferrinizzard.prettier-sql-vscode` | SQL formatting for migration files |
| **GitLens** | `eamodio.gitlens` | Enhanced Git history, blame, and branch views |
| **GitHub Copilot** | `github.copilot` | AI code completion (requires GitHub Copilot subscription) |
| **GitHub Copilot Chat** | `github.copilot-chat` | Chat with Copilot inside VS Code |
| **Error Lens** | `usernamehw.errorlens` | Shows TypeScript/lint errors inline on the same line |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Renames closing JSX/HTML tag when you rename the opening one |
| **Path IntelliSense** | `christian-kohler.path-intellisense` | Autocompletes file paths in imports |

### 🟡 Highly Recommended

| Extension | Extension ID | Why You Need It |
|---|---|---|
| **Pretty TypeScript Errors** | `yoavbls.pretty-ts-errors` | Makes TypeScript error messages readable |
| **Headwind** | `heybourn.headwind` | Auto-sorts Tailwind classes into consistent order |
| **i18n Ally** | `lokalise.i18n-ally` | Useful if you add multi-language support later |
| **Better Comments** | `aaron-bond.better-comments` | Color-codes `// TODO`, `// !`, `// ?` comments |
| **Bookmarks** | `alefragnani.bookmarks` | Bookmark lines to jump between key files quickly |
| **Todo Tree** | `gruntfuggly.todo-tree` | Shows all `// TODO` comments in a sidebar tree |
| **Thunder Client** | `rangav.vscode-thunder-client` | Lightweight API tester built into VS Code (like Postman) |
| **Docker** | `ms-azuretools.vscode-docker` | Useful if you add Docker later |

### 🟢 Quality of Life

| Extension | Extension ID | Why You Need It |
|---|---|---|
| **Material Icon Theme** | `pkief.material-icon-theme` | File icons that make your folder tree easier to read |
| **One Dark Pro** | `zhuangtongfa.material-theme` | Popular dark theme — easy on the eyes for long sessions |
| **Indent Rainbow** | `oderwat.indent-rainbow` | Colors indentation levels — great for nested JSX |
| **Peacock** | `johnpapa.vscode-peacock` | Color-codes VS Code window per project |
| **WakaTime** | `wakatime.vscode-wakatime` | Tracks your coding time — useful for portfolio / CV |

---

### Quick Install via Terminal

Open the VS Code terminal (`Ctrl+\``) and paste this to install all essential extensions at once:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension pmneo.tsimporter
code --install-extension eamodio.gitlens
code --install-extension github.copilot
code --install-extension github.copilot-chat
code --install-extension usernamehw.errorlens
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension yoavbls.pretty-ts-errors
code --install-extension heybourn.headwind
code --install-extension aaron-bond.better-comments
code --install-extension gruntfuggly.todo-tree
code --install-extension rangav.vscode-thunder-client
code --install-extension pkief.material-icon-theme
```

---

## 2. VS Code Settings

### Workspace Settings File

Create this file at the root of your project:

**File:** `.vscode/settings.json`

```json
{
  // ── Editor ────────────────────────────────────────────────────
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.wordWrap": "on",
  "editor.rulers": [100],
  "editor.minimap.enabled": false,
  "editor.linkedEditing": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  "editor.stickyScroll.enabled": true,
  "editor.inlayHints.enabled": "on",

  // ── Format on Save ────────────────────────────────────────────
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },

  // ── TypeScript ────────────────────────────────────────────────
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.autoImports": true,
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,

  // ── Tailwind ──────────────────────────────────────────────────
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },

  // ── ESLint ────────────────────────────────────────────────────
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  // ── Files ──────────────────────────────────────────────────────
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  },

  // ── Explorer ───────────────────────────────────────────────────
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.test.ts, ${capture}.types.ts",
    "*.tsx": "${capture}.test.tsx",
    "package.json": "package-lock.json, .eslintrc*, .prettierrc*, tsconfig*, next.config*, tailwind.config*, postcss.config*"
  },
  "explorer.sortOrder": "type",

  // ── Git ────────────────────────────────────────────────────────
  "git.autofetch": true,
  "git.confirmSync": false,
  "gitlens.hovers.currentLine.over": "line",

  // ── Copilot ────────────────────────────────────────────────────
  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "plaintext": false,
    "scminput": false
  },

  // ── Prettier (overrides .prettierrc) ──────────────────────────
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.wordWrap": "on",
    "editor.formatOnSave": false
  },

  // ── Error Lens ────────────────────────────────────────────────
  "errorLens.enabledDiagnosticLevels": ["error", "warning"],
  "errorLens.excludeBySource": ["cSpell"],

  // ── Todo Tree ─────────────────────────────────────────────────
  "todo-tree.regex.regex": "(//|#|<!--|;|/\\*)\\s*($TAGS)",
  "todo-tree.highlights.defaultHighlight": {
    "foreground": "#ffffff",
    "background": "#ffa500",
    "icon": "alert",
    "type": "tag"
  },
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "HACK",
    "NOTE",
    "REVIEW",
    "Phase 2",
    "Phase 3",
    "Phase 4",
    "Phase 5"
  ]
}
```

---

### Prettier Config

**File:** `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

> Install the Tailwind Prettier plugin: `npm install -D prettier-plugin-tailwindcss`

---

### ESLint Config

**File:** `eslint.config.mjs`

```js
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];

export default eslintConfig;
```

> This enforces the `no any` rule from the proposal's DON'T list automatically.

---

### TypeScript Config

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@/shared/*": ["./shared/*"],
      "@/modules/*": ["./modules/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> The `paths` aliases let you write `import { ROLES } from '@/shared/constants/roles'`
> instead of `import { ROLES } from '../../../shared/constants/roles'`.

---

## 3. Project Folder Setup

### Step 1 — Bootstrap Next.js

Open your terminal and run:

```bash
npx create-next-app@latest ccip --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"
cd ccip
```

When prompted:
- ✅ TypeScript → Yes
- ✅ ESLint → Yes
- ✅ Tailwind CSS → Yes
- ✅ `src/` directory → **No** (we use root-level `app/`)
- ✅ App Router → Yes
- ✅ Import alias → `@/*`

---

### Step 2 — Install Core Dependencies

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Validation
npm install zod

# Rich Text Editor (Phase 3 — install now, use later)
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit

# Email (Phase 2 — install now, use later)
npm install resend

# HTML Sanitization
npm install dompurify
npm install -D @types/dompurify

# Utilities
npm install clsx tailwind-merge date-fns slugify

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-config-prettier
```

---

### Step 3 — Create the Full Folder Structure

Run this in your terminal from the project root:

```bash
# Module folders
mkdir -p modules/auth/{components,api,hooks,types}
mkdir -p modules/users/{components,api,hooks,types}
mkdir -p modules/roles/{components,api,hooks,types}
mkdir -p modules/organizations/{components,api,hooks,types}
mkdir -p modules/content/{components,api,hooks,types}
mkdir -p modules/notifications/{components,api,hooks,types}
mkdir -p modules/media/{components,api,hooks,types}
mkdir -p modules/search/{components,api,hooks,types}
mkdir -p modules/publication/{components,api,hooks,types}
mkdir -p modules/forum/{components,api,hooks,types}
mkdir -p modules/moderation/{components,api,hooks,types}
mkdir -p modules/external_publish/{components,api,hooks,types}
mkdir -p modules/admin/{components,api,hooks,types}

# Shared folders
mkdir -p shared/{components,hooks,types,utils,constants,lib}

# App router pages
mkdir -p "app/(auth)"
mkdir -p "app/(portal)"
mkdir -p app/api

# Tests
mkdir -p tests/{unit,integration,e2e}

# Supabase migrations
mkdir -p supabase/migrations

# VS Code config
mkdir -p .vscode

# GitHub Actions
mkdir -p .github/workflows

echo "✅ Folder structure created"
```

---

### Step 4 — Create Starter Files

#### Supabase Client

**File:** `shared/lib/supabase.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client (uses anon key + RLS)
// Use this in React components and client hooks
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**File:** `shared/lib/supabase-server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client (for API routes and Server Components)
// NEVER import this in client components
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

#### Roles Constants

**File:** `shared/constants/roles.ts`

```typescript
// DO NOT change these string values — they match the database seed data

export const ROLES = {
  STUDENT:           'STUDENT',
  DEPT_EDITOR:       'DEPT_EDITOR',
  UNIVERSITY_EDITOR: 'UNIVERSITY_EDITOR',
  SUPER_ADMIN:       'SUPER_ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

#### Content Constants

**File:** `modules/content/constants/index.ts`

```typescript
export const ANNOUNCEMENT_STATUS = {
  DRAFT:     'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED:  'ARCHIVED',
} as const;

export type AnnouncementStatus =
  typeof ANNOUNCEMENT_STATUS[keyof typeof ANNOUNCEMENT_STATUS];

export const ANNOUNCEMENT_VISIBILITY = {
  PUBLIC:    'PUBLIC',
  ORG_ONLY:  'ORG_ONLY',
  DEPT_ONLY: 'DEPT_ONLY',
} as const;

export type AnnouncementVisibility =
  typeof ANNOUNCEMENT_VISIBILITY[keyof typeof ANNOUNCEMENT_VISIBILITY];
```

#### Tags Constants

**File:** `shared/constants/tags.ts`

```typescript
export const CONTENT_TAGS = [
  'general',
  'events',
  'enrollment',
  'scholarship',
  'deadline',
  'academic',
  'extracurricular',
  'emergency',
  'facility',
  'career',
] as const;

export type ContentTag = typeof CONTENT_TAGS[number];
```

#### Environment Variables Template

**File:** `.env.local` ← never commit this

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INSTITUTIONAL_DOMAIN=university.edu.ph
RESEND_API_KEY=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

**File:** `.env.example` ← commit this (no real values)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INSTITUTIONAL_DOMAIN=
RESEND_API_KEY=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

#### .gitignore additions

Make sure these are in your `.gitignore`:

```
.env.local
.env.*.local
.next/
node_modules/
```

---

### Step 5 — Final Folder Tree

After setup, your project should look like this:

```
ccip/
├── .github/
│   └── workflows/
├── .vscode/
│   ├── settings.json         ← from Section 2
│   ├── extensions.json       ← from Section 4
│   └── ccip.code-snippets    ← from Section 5
├── app/
│   ├── (auth)/
│   ├── (portal)/
│   └── api/
├── modules/
│   ├── auth/
│   ├── content/             ← official announcements foundation
│   ├── notifications/
│   ├── organizations/
│   ├── roles/
│   ├── users/
│   ├── media/
│   ├── search/
│   ├── publication/
│   ├── forum/
│   ├── moderation/
│   ├── external_publish/
│   └── admin/
├── shared/
│   ├── components/
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── content.ts
│   │   └── tags.ts
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── supabase-server.ts
│   ├── types/
│   └── utils/
├── supabase/
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── .env.example
├── .env.local              ← never commit
├── eslint.config.mjs
├── .gitignore
├── .prettierrc
├── CCIP_PROJECT_PROPOSAL.md
├── next.config.ts
├── package.json
├── README.md
└── tsconfig.json
```

---

## 4. Workspace File

Create this file so VS Code opens CCIP with the right settings and recommended extensions pre-listed.

**File:** `ccip.code-workspace`

```json
{
  "folders": [
    {
      "name": "CCIP — Root",
      "path": "."
    },
    {
      "name": "CCIP — Modules",
      "path": "./modules"
    },
    {
      "name": "CCIP — Shared",
      "path": "./shared"
    },
    {
      "name": "CCIP — Supabase",
      "path": "./supabase"
    }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "typescript.tsdk": "node_modules/typescript/lib"
  },
  "extensions": {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss",
      "github.copilot",
      "github.copilot-chat",
      "usernamehw.errorlens",
      "eamodio.gitlens",
      "yoavbls.pretty-ts-errors",
      "gruntfuggly.todo-tree",
      "rangav.vscode-thunder-client",
      "pkief.material-icon-theme",
      "aaron-bond.better-comments",
      "heybourn.headwind",
      "formulahendry.auto-rename-tag"
    ]
  },
  "launch": {
    "configurations": [
      {
        "name": "Next.js Dev Server",
        "type": "node",
        "request": "launch",
        "program": "${workspaceFolder}/node_modules/.bin/next",
        "args": ["dev"],
        "cwd": "${workspaceFolder}",
        "env": {
          "NODE_ENV": "development"
        }
      }
    ]
  }
}
```

> Open with: `File → Open Workspace from File → ccip.code-workspace`
> Anyone who clones the repo and opens this file gets the extension recommendations automatically.

---

## 5. Recommended Snippets

Create custom snippets so you can scaffold module files instantly.

**File:** `.vscode/ccip.code-snippets`

```json
{
  "CCIP Service File": {
    "prefix": "ccip-service",
    "description": "Scaffold a CCIP module service file",
    "body": [
      "import { createServerSupabaseClient } from '@/shared/lib/supabase-server';",
      "",
      "/**",
      " * ${1:Module} Service",
      " * Handles all database interactions for the ${1:module} module.",
      " */",
      "",
      "/**",
      " * ${2:Description of function}",
      " */",
      "export async function ${3:functionName}() {",
      "  const supabase = await createServerSupabaseClient();",
      "",
      "  const { data, error } = await supabase",
      "    .from('${4:table}')",
      "    .select('*');",
      "",
      "  if (error) throw new Error(error.message);",
      "  return data;",
      "}"
    ]
  },

  "CCIP API Route": {
    "prefix": "ccip-api",
    "description": "Scaffold a CCIP API route handler",
    "body": [
      "import { NextRequest, NextResponse } from 'next/server';",
      "import { createServerSupabaseClient } from '@/shared/lib/supabase-server';",
      "import { z } from 'zod';",
      "",
      "const schema = z.object({",
      "  ${1:field}: z.string(),",
      "});",
      "",
      "export async function POST(req: NextRequest) {",
      "  try {",
      "    const supabase = await createServerSupabaseClient();",
      "    const { data: { user } } = await supabase.auth.getUser();",
      "",
      "    if (!user) {",
      "      return NextResponse.json(",
      "        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },",
      "        { status: 401 }",
      "      );",
      "    }",
      "",
      "    const body = await req.json();",
      "    const parsed = schema.safeParse(body);",
      "",
      "    if (!parsed.success) {",
      "      return NextResponse.json(",
      "        { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } },",
      "        { status: 422 }",
      "      );",
      "    }",
      "",
      "    // TODO: implement logic",
      "",
      "    return NextResponse.json({ data: null, error: null }, { status: 200 });",
      "  } catch (err) {",
      "    console.error(err);",
      "    return NextResponse.json(",
      "      { data: null, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },",
      "      { status: 500 }",
      "    );",
      "  }",
      "}"
    ]
  },

  "CCIP React Component": {
    "prefix": "ccip-component",
    "description": "Scaffold a CCIP React component",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:string};",
      "}",
      "",
      "export function ${1:ComponentName}({ ${2:prop} }: ${1:ComponentName}Props) {",
      "  return (",
      "    <div className=\"${4:}\">",
      "      ${0}",
      "    </div>",
      "  );",
      "}"
    ]
  },

  "CCIP Type Interface": {
    "prefix": "ccip-type",
    "description": "Scaffold a CCIP TypeScript interface",
    "body": [
      "export interface I${1:Name} {",
      "  id: string;",
      "  createdAt: string;",
      "  ${2:field}: ${3:string};",
      "}"
    ]
  },

  "CCIP TODO Phase": {
    "prefix": "ccip-todo",
    "description": "Add a phase-deferred TODO comment",
    "body": [
      "// TODO: Phase ${1|2,3,4,5|} — ${2:description}"
    ]
  }
}
```

**How to use snippets:**
- In any `.ts` or `.tsx` file, type the prefix (e.g., `ccip-api`) and press `Tab`
- The template scaffolds instantly with your cursor on the first placeholder

---

## 6. First-Time Checklist

Work through this in order before writing any feature code.

### Environment
- [ ] VS Code installed and opened to the `ccip/` folder
- [ ] All essential extensions installed (Section 1)
- [ ] `.vscode/settings.json` created (Section 2)
- [ ] `.prettierrc` and `eslint.config.mjs` created (Section 2)
- [ ] `tsconfig.json` updated with strict mode and path aliases (Section 2)

### Project Bootstrap
- [ ] `npx create-next-app` run with correct options
- [ ] All npm packages installed (Section 3, Step 2)
- [ ] Full folder structure created (Section 3, Step 3)
- [ ] Starter files created: `supabase.ts`, `roles.ts`, `content.ts`, `tags.ts` (Section 3, Step 4)
- [ ] `.env.local` created with Supabase keys (never committed)
- [ ] `.env.example` created and committed

### Git Setup
- [ ] `git init` run (or repo cloned from GitHub)
- [ ] First commit made with project scaffold: `git commit -m "chore: initial project scaffold"`
- [ ] `main` and `dev` branches created
- [ ] `.gitignore` confirms `.env.local` is excluded

### Copilot Integration
- [ ] `CCIP_PROJECT_PROPOSAL.md` copied to project root
- [ ] GitHub Copilot extension installed and signed in
- [ ] Open the proposal file once in VS Code so Copilot indexes it as context
- [ ] Test Copilot: open `modules/content/content.service.ts` and type `// get all published announcements` — Copilot should suggest a Supabase query for the current announcements foundation

### Verify Everything Works
- [ ] `npm run dev` starts without errors
- [ ] `npm run type-check` (add to `package.json` scripts: `"type-check": "tsc --noEmit"`) returns zero errors
- [ ] `npm run lint` returns zero errors
- [ ] VS Code shows Tailwind class autocomplete in a `.tsx` file
- [ ] VS Code shows TypeScript errors inline via Error Lens

---

### Useful package.json Scripts to Add

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress open"
  }
}
```

---

*CCIP VS Code Setup Guide | Pair with `CCIP_PROJECT_PROPOSAL.md` for the full modular product context*
