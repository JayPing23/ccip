# CCIP Design System — UI/UX Implementation Guide

> **Campus Communications & Interaction Platform**
> Next.js + Tailwind CSS + Supabase | Modular Monolith
>
> This document defines the visual language, component standards, and interaction patterns for CCIP.
> It is written for AI coding agents and developers implementing UI changes across the platform.
> Read this before creating or modifying any UI component.

---

## Platform Context

CCIP is a unified campus platform with three content pillars:

1. **Official Announcements** — Trusted institutional updates from university offices
2. **Student Publication** — Campus journalism, features, editorials, and organization-led reporting
3. **Community Forum** — Moderated discussion spaces for students and faculty

Each pillar has its own views and workflows, but they share a single authenticated shell with a persistent header, notification system, and dashboard.

### Target Users

| Persona | Primary Actions |
|---|---|
| Student Reader | Browse dashboard, read announcements, read articles, participate in forum, manage notification preferences |
| Faculty / Staff | Read official updates, browse campus news, optionally participate in discussions |
| Department Editor | Create and publish official announcements, target by organization, schedule posts |
| Publication Writer / Editor | Draft articles, submit for editorial review, manage publication workflow |
| Moderator / Super Admin | Manage users, roles, organizations, moderate content, view analytics, configure retention |

### Current Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router (Server + Client Components) |
| Styling | Tailwind CSS (utility-first, no custom config yet) |
| Language | TypeScript strict mode |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + Google OAuth (institutional domain) |
| Rich Text | Tiptap editor |
| Validation | Zod |
| Email | Resend |
| Hosting | Vercel |

---

## Phase 1 — Design Requirements

### Goals

CCIP must feel like:

• A clean, trustworthy campus information hub — not a social media feed
• A professional publishing platform for campus journalism
• A safe, moderated discussion space — not an anonymous forum
• One unified product with clearly separated content types

### Design Principles

| Principle | Application to CCIP |
|---|---|
| Content-type clarity | Announcements, articles, and forum threads must always be visually distinguishable |
| Trust signals | Official content from institutions must look authoritative; community content must look approachable |
| Information density control | Dashboard shows summaries; dedicated feeds show full lists with filters |
| Role-aware UI | Show action buttons (New Announcement, Write Article, Admin Console) only to authorized users |
| Three-click rule | Any content should be reachable from the dashboard within 3 clicks |

### Avoid

• Mixing announcement, article, and forum content into one undifferentiated feed
• Social-media patterns (infinite scroll without context, algorithmic feeds)
• Overloading the dashboard with too many widgets
• Visual clutter in the admin console
• Inaccessible color combinations

---

## Phase 2 — Design Philosophy

### HCI Principles Applied to CCIP

| Principle | CCIP Implementation |
|---|---|
| Visibility of system status | Show publish state badges (draft, published, archived), loading spinners, toast notifications on all mutations |
| Consistency | Use the same card pattern for announcements, articles, and threads; use the same form layout for all create/edit flows |
| Recognition over recall | Persistent header with nav links (Dashboard, Announcements, Campus News, Forum); breadcrumbs in nested views |
| Error prevention | Zod validation on all forms before submission; confirmation dialogs on destructive actions (delete, archive) |
| Flexibility | Quick actions on dashboard for power users; full feeds with filters for discovery |
| Minimalist design | Show only relevant actions per user role; collapse secondary info behind expandable sections |
| Clear feedback | Toast messages for success/error/info/warning; inline form validation; disabled states on unauthorized actions |

### UX Philosophy: Frictionless Campus Communication

Students should be able to:

• Open CCIP and immediately see what's new (dashboard)
• Read an official announcement in one click from the dashboard
• Browse and filter all campus news without confusion
• Post a forum reply without leaving the thread view
• Manage notification preferences without hunting through settings

Editors should be able to:

• Create and publish an announcement in under 60 seconds
• See the editorial status of all their articles at a glance
• Access the moderation queue without navigating away from admin

---

## Phase 3 — Color System

### Brand Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#355872` | Deep Blue — headings, primary text, nav, buttons |
| `secondary` | `#7AAACE` | Muted Blue — card borders, dividers, secondary backgrounds, UI accents |
| `accent` | `#9CD5FF` | Sky Blue — accent buttons, highlights, hover states, interactive elements |
| `background` | `#F7F8F0` | Cream — page background, content areas |
| `surface` | `#FFFFFF` | White — cards, modals, form fields |
| `text-primary` | `#355872` | Primary body text |
| `text-secondary` | `#5A7A8F` | Secondary/muted text |
| `text-muted` | `#8FA5B5` | Placeholder text, timestamps, metadata |

### Semantic Colors (Status & Feedback)

| Token | Light Mode | Usage |
|---|---|---|
| `success` | `#16A34A` (green-600) | Published badges, success toasts, positive actions |
| `error` | `#DC2626` (red-600) | Error toasts, delete buttons, validation errors |
| `warning` | `#EAB308` (yellow-500) | Warning toasts, draft badges, pending states |
| `info` | `#355872` (primary) | Info toasts, informational badges |

### Content-Type Visual Markers

Each content type should carry a subtle visual identity:

| Content Type | Accent Color | Icon Suggestion |
|---|---|---|
| Official Announcement | `#355872` (primary/authoritative) | Megaphone or shield |
| Campus Article | `#7AAACE` (secondary/editorial) | Newspaper or pen |
| Forum Thread | `#9CD5FF` (accent/community) | Chat bubbles or people |

### Accessibility Rules

WCAG 2.1 AA minimum, AAA preferred for text.

Approved contrast pairs:

• `#355872` on `#F7F8F0` → **AAA** (primary text on background) ✓
• `#355872` on `#9CD5FF` → **AA** (text on accent) ✓
• `#355872` on `#FFFFFF` → **AAA** (text on surface) ✓

**Do not use for text:**

• `#7AAACE` on `#F7F8F0` — insufficient contrast for small text
• `#9CD5FF` on `#F7F8F0` — insufficient contrast for any text

**Use `#7AAACE` only for:**

• Card borders and dividers
• Background tints on non-text UI elements
• Icon fills paired with text labels

### Tailwind Theme Extension

Map the brand palette into `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#355872',
        secondary: '#7AAACE',
        accent: '#9CD5FF',
        bg: '#F7F8F0',
        surface: '#FFFFFF',
      },
    },
  },
}
```

Replace existing hardcoded `blue-600`, `blue-700`, `gray-50`, `gray-100` usages with brand tokens as components are updated.

---

## Phase 4 — Light Mode

| Element | Value |
|---|---|
| Page background | `#F7F8F0` (brand-bg) |
| Card / modal surface | `#FFFFFF` (brand-surface) |
| Primary text | `#355872` (brand-primary) |
| Secondary text | `#5A7A8F` |
| Primary buttons | `#355872` bg, `#FFFFFF` text |
| Accent / secondary buttons | `#9CD5FF` bg, `#355872` text |
| Card borders | `#7AAACE` at 30% opacity |
| Header | `#FFFFFF` with subtle bottom shadow |
| Active nav link | `#355872` text, `#9CD5FF` underline |

The light mode should feel: **soft, breathable, and institutional** — like a well-designed campus bulletin board, not a startup marketing page.

---

## Phase 5 — Dark Mode

| Element | Value |
|---|---|
| Page background | `#1E3A4F` (darker variant of primary) |
| Card / modal surface | `#355872` (brand-primary) |
| Primary text | `#F7F8F0` (brand-bg inverted) |
| Secondary text | `#9CD5FF` (accent) |
| Primary buttons | `#9CD5FF` bg, `#1E3A4F` text |
| Accent / secondary buttons | `#7AAACE` bg, `#1E3A4F` text |
| Card borders | `#7AAACE` at 40% opacity |
| Header | `#1E3A4F` with subtle bottom border |
| Active nav link | `#9CD5FF` text |

Dark mode must:

• Reduce eye strain during late-night study sessions
• Maintain clear visual hierarchy between content types
• Keep announcement/article/forum visual markers distinguishable
• Never lose readability on status badges or metadata

Implementation: Use Tailwind `dark:` variant classes with a `class` strategy on `<html>`. Store preference in `localStorage` with system-preference fallback.

---

## Phase 6 — Responsive System

### Breakpoints (Tailwind defaults)

| Name | Width | CCIP Layout |
|---|---|---|
| Mobile | < 640px | Single column, hamburger menu, stacked cards |
| Tablet | 640px–1024px | Two-column dashboard, side nav optional |
| Desktop | > 1024px | Full sidebar or top nav, multi-column dashboard, wider content areas |

### Layout Rules by Page

| Page | Mobile | Desktop |
|---|---|---|
| Dashboard | Stacked: announcements → articles → threads → quick actions | 2–3 column grid: announcements left, articles center, threads right |
| Announcement Feed | Full-width cards, sticky search bar | Cards with sidebar filters |
| Campus News Feed | Full-width article cards | Magazine-style grid (featured + list) |
| Forum | Category list → thread list → thread view (drill-down) | Category sidebar + thread list + thread view (split pane) |
| Content Create/Edit | Full-width form, floating save button | Centered form (max-w-3xl) with sidebar preview |
| Admin Dashboard | Stacked stat cards, scrollable tables | Grid stats + tabbed tables |

### Mobile-Specific Rules

• Persistent bottom bar with: Dashboard, Announcements, News, Forum (4 items max)
• Header collapses to logo + hamburger + notification bell
• Touch targets minimum 44×44px
• Card actions (edit, delete) accessible via swipe or overflow menu
• Forms use full-width inputs, larger tap areas on checkboxes/toggles

---

## Phase 7 — Typography System

### Font Selection

**Primary font:** Inter

Inter is chosen because:
• Excellent readability at all sizes
• Designed for screens
• Free and open-source
• Wide language support for a campus environment
• Available via Google Fonts or `next/font`

**Fallback stack:** `Inter, system-ui, -apple-system, sans-serif`

### Type Scale

| Level | Size | Weight | Usage |
|---|---|---|---|
| H1 | 36px (2.25rem) | 700 | Page titles (Dashboard, Announcements, Campus News) |
| H2 | 28px (1.75rem) | 600 | Section headers (Recent Announcements, Latest Threads) |
| H3 | 22px (1.375rem) | 600 | Card titles (announcement title, article headline, thread subject) |
| Body | 16px (1rem) | 400 | Content body, form labels, descriptions |
| Small | 14px (0.875rem) | 400 | Metadata (timestamps, author names, organization labels, badge text) |
| Caption | 12px (0.75rem) | 500 | Helper text, character counts, version labels |

### Responsive Scaling

• H1 scales down to 28px on mobile
• H2 scales down to 22px on mobile
• Body remains 16px (never smaller for accessibility)
• Line height: 1.5 for body text, 1.3 for headings

---

## Phase 8 — Component Design System

### Existing Components (Already Implemented)

| Component | Location | Status |
|---|---|---|
| Header | `shared/components/Header.tsx` | Needs brand color migration |
| Toast | `shared/components/Toast.tsx` | Working; keep semantic colors |
| ContentCard | `modules/content/components/ContentCard.tsx` | Needs brand + content-type marker |
| ContentFeed | `modules/content/components/ContentFeed.tsx` | Needs filter sidebar on desktop |
| ContentForm | `modules/content/components/ContentForm.tsx` | Needs brand styling |
| ArticleFeed | `modules/publication/components/ArticleFeed.tsx` | Needs magazine layout option |
| ArticleForm | `modules/publication/components/ArticleForm.tsx` | Needs brand styling |
| ForumCategoryList | `modules/forum/components/ForumCategoryList.tsx` | Needs content-type color marker |
| ThreadView | `modules/forum/components/ThreadView.tsx` | Working |
| NotificationBell | `modules/notifications/components/NotificationBell.tsx` | Needs brand accent |
| NotificationCenter | `modules/notifications/components/NotificationCenter.tsx` | Working |
| SearchFilters | `modules/search/components/SearchFilters.tsx` | Needs brand styling |
| Admin Dashboard | `modules/admin/components/Dashboard.tsx` | Needs stat card design |

### New / Updated Components Needed

**Navigation**
• `Sidebar` — Desktop left sidebar for admin pages
• `MobileBottomNav` — 4-tab bottom navigation (Dashboard, Announcements, News, Forum)
• `Breadcrumbs` — For nested routes (Admin > Users, Forum > Category > Thread)
• Updated `Header` — Brand colors, dark mode toggle, responsive mobile menu

**Content Cards**
• `AnnouncementCard` — With organization badge, publish date, status indicator, priority marker
• `ArticleCard` — With author byline, category tag, featured image thumbnail, editorial status
• `ThreadCard` — With category label, reply count, reaction summary, last activity timestamp

**Forms**
• `BrandButton` — Primary (`#355872`), secondary (`#9CD5FF`), danger (`red-600`), ghost styles
• `BrandInput` — Text field with `#355872` focus ring, `#7AAACE` border
• `BrandSelect` — Dropdown matching brand style
• `BrandToggle` — For notification preferences, dark mode, admin settings

**Feedback**
• `StatusBadge` — Reusable badge for: draft, in-review, published, archived, flagged
• `EmptyState` — Illustrated empty states per content type ("No announcements yet", "No threads in this category")
• `LoadingSkeleton` — Skeleton loaders matching card layout shapes
• `ConfirmDialog` — Modal for destructive actions (delete announcement, ban user)

### Component State Rules

Every interactive component must define:

| State | Visual Treatment |
|---|---|
| Default | Brand primary colors, standard borders |
| Hover | Slight background shift, subtle elevation (shadow-sm → shadow-md) |
| Focus | `#355872` focus ring (2px outline offset) for keyboard navigation |
| Active | Slightly darker background, pressed feel |
| Disabled | 50% opacity, cursor-not-allowed, no pointer events |
| Loading | Spinner or skeleton replacing content area |

---

## Phase 9 — Interaction Design

### Micro-Interactions for CCIP

| Interaction | Animation | Duration |
|---|---|---|
| Card hover | Subtle shadow elevation + 1px Y translate | 200ms ease-out |
| Button hover | Background color darken by 10% | 150ms ease-in-out |
| Toast appear | Slide in from bottom-right + fade in | 250ms ease-out |
| Toast dismiss | Fade out + slide down | 200ms ease-in |
| Theme toggle | Cross-fade between light/dark | 300ms ease-in-out |
| Notification badge | Scale pulse on new count | 300ms ease-in-out |
| Tab/nav switch | Content area cross-fade | 150ms ease-in-out |
| Form submit | Button shows spinner, disables | Immediate |
| Publish success | Card status badge transitions color | 200ms ease-in-out |

### Animation Rules

• **Max duration:** 300ms for any UI transition
• **Easing:** `ease-in-out` for most transitions, `ease-out` for entrances
• **Respect `prefers-reduced-motion`:** Disable all non-essential animations when the OS-level setting is active
• **No parallax, no auto-play video, no scroll-jacking**
• Page transitions: instant route change, no full-page animations

---

## Phase 10 — Navigation Architecture

### Primary Navigation (Header)

```
[CCIP Logo] — Dashboard — Announcements — Campus News — Forum — [🔔 Notifications] — [Avatar ▼]
```

• Logo links to `/dashboard`
• Active page indicated by `#9CD5FF` underline and `#355872` bold text
• Notification bell shows unread count badge
• Avatar dropdown: Profile, Preferences, Admin Console (if authorized), Logout

### Conditional Action Buttons (Role-Aware)

| Role | Visible Actions |
|---|---|
| Student Reader | (no create actions) |
| Department Editor | "New Announcement" button in header |
| Publication Writer | "Write Article" button in header |
| Moderator / Admin | "Admin Console" button in header |

### Mobile Navigation

**Top:** Compact header with logo, hamburger menu, notification bell
**Bottom:** Fixed tab bar with 4 items:

```
[ 🏠 Dashboard ]  [ 📢 Announcements ]  [ 📰 News ]  [ 💬 Forum ]
```

### Admin Navigation (Sidebar)

When inside `/admin/*` routes:

```
Admin Console
├── Dashboard (stats overview)
├── Users
├── Roles
├── Organizations
├── Content Moderation
├── Retention
└── ← Back to Platform
```

### Breadcrumbs

Show breadcrumbs on all nested routes:

• `Forum > Technology > "Best study apps?"` (thread view)
• `Admin > Users > Edit User` (admin detail view)
• `Announcements > "Fall Enrollment Notice"` (announcement detail)

---

## Phase 11 — Accessibility

### WCAG 2.1 AA Compliance Checklist for CCIP

**Color & Contrast**
• All text meets 4.5:1 contrast ratio minimum (body) and 3:1 (large text/headings)
• Status badges use both color and text labels (not color alone)
• Focus indicators visible on all interactive elements

**Keyboard Navigation**
• Full tab-order navigation through header → content → footer
• Skip-to-content link already present (skip links implemented)
• Arrow key navigation within dropdowns and menus
• Escape key closes modals, notifications, and dropdowns
• Enter/Space activates buttons and links

**Screen Readers**
• ARIA navigation labels already on landmark regions (implemented)
• `aria-live="polite"` on toast container and notification badge
• `role="alert"` on form validation errors
• Meaningful alt text on all images (article thumbnails, user avatars)
• `aria-current="page"` on active nav links

**Forms**
• All inputs have associated `<label>` elements
• Required fields marked with both `required` attribute and visual indicator
• Error messages associated via `aria-describedby`
• Form submission errors announced to screen readers

**Motion**
• `@media (prefers-reduced-motion: reduce)` disables all non-essential animations
• No auto-playing animations or carousels

---

## Phase 12 — UX Validation Checklist

Evaluate every design change against these CCIP-specific criteria:

### Content Discovery
- [x] Can a student find the latest announcement from their department within 2 clicks from the dashboard?
- [x] Can a reader distinguish between an official announcement, a campus article, and a forum thread at a glance?
- [x] Does the feed page clearly communicate what filters are active?

### Content Creation
- [x] Can a department editor create and publish an announcement in under 60 seconds?
- [x] Is the article editorial workflow (draft → in-review → published) visible and understandable?
- [x] Can a student create a new forum thread without confusion about categories?

### Navigation
- [x] Is the current page always clear from the header/nav state?
- [x] Can a user return to the dashboard from any page in one click?
- [x] Do breadcrumbs accurately reflect the user's position in nested views?

### Admin
- [x] Can an admin access the moderation queue in 2 clicks from anywhere?
- [x] Are destructive admin actions (delete, ban) protected with confirmation dialogs?
- [x] Is the admin dashboard legible with real data volumes (100+ users, 500+ posts)?

### Responsiveness
- [x] Does the dashboard remain usable on a 375px-wide phone screen?
- [x] Are all form fields reachable and usable on touch devices?
- [x] Does the mobile bottom nav correctly highlight the active section?

### Dark Mode
- [x] Are all status badges readable in dark mode?
- [x] Does the forum thread view maintain visual hierarchy in dark mode?
- [x] Are form field borders and focus rings visible against the dark background?

---

## Phase 13 — Implementation Priorities

### Step 1: Tailwind Theme Setup
- Create `tailwind.config.ts` with brand color tokens
- Add Inter font via `next/font`
- Define dark mode strategy (`class` on `<html>`)

### Step 2: Core Component Migration
- Update `Header.tsx` to use brand colors, add dark mode toggle, improve mobile responsiveness
- Update `Toast.tsx` to use brand semantic colors
- Create `BrandButton`, `BrandInput`, `StatusBadge` primitives in `shared/components/`

### Step 3: Page-Level Updates
- Dashboard: Implement multi-column grid with content-type markers
- Feeds: Add filter sidebar (desktop), sticky search (mobile)
- Forum: Add category color markers, improve thread layout
- Admin: Add sidebar navigation, improve stat card design

### Step 4: Dark Mode
- Implement theme toggle with `localStorage` persistence + system preference detection
- Add `dark:` Tailwind variants to all updated components
- Validate all contrast ratios in dark mode

### Step 5: Mobile Polish
- Add `MobileBottomNav` component
- Collapse header to hamburger + bell on mobile
- Ensure all forms are touch-friendly with 44px+ tap targets

---

## Design Goal

CCIP should feel like the **official digital campus** — a place where students and faculty go first for trusted information, campus stories, and community discussion.

The visual language must communicate:

• **Authority** for institutional announcements (clean, structured, badge-driven)
• **Editorial quality** for student publications (readable, image-rich, magazine-inspired)
• **Community warmth** for forum discussions (approachable, conversational, moderated)

All three must live under one cohesive design system that never confuses which content type the user is viewing.

The interface should be so clear that a first-year student can navigate announcements, read campus news, and join a forum discussion on their first visit — without any tutorial or onboarding.

---

## Design Inspiration Sources

Campus & news platforms:
• SLU Philippines website (https://www.slu.edu.ph/) — institutional layout and trust signals
• New York Times (https://www.nytimes.com/) — editorial content hierarchy and typography
• Dribbble web design (https://dribbble.com/shots/popular/web-design) — modern UI patterns

Reference these for layout patterns, not for direct visual copying. CCIP has its own brand identity defined above.
