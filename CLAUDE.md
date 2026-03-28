# CLAUDE.md — Flashcard Project Guide

This file provides essential context for AI assistants working on this codebase.

---

## Project Overview

A multi-app web platform for two users (Be🐒 / Princesse chat🚀) built as a personal hub with 6 live apps:

| App | Description |
|-----|-------------|
| **Mémoire de Singe** | Flashcard app with multi-criterion spaced repetition |
| **Météo** | Weather aggregator comparing 6 forecast models |
| **Grimoire** | Recipe manager with Spoonacular integration |
| **Bisou** | Emoji messaging between profiles |
| **Programme** | Shared event calendar |
| **Orbite** | Sports tracking with gamification |

Deployed at: https://flashcard-ten-virid.vercel.app
GitHub: `pokjungle/flashcard`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 (JSX, no TypeScript) |
| Build Tool | Vite 8 |
| CSS | Tailwind CSS 3 |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel (serverless functions in `/api/`) |
| Package Manager | npm |

**No TypeScript** — all source files use `.jsx` or `.js`.
**No React Router** — navigation is manual state (`screen` state variable).
**No test runner** — linting only via ESLint.

---

## Directory Structure

```
flashcard/
├── api/
│   └── proxy.js          # Vercel serverless: CORS proxy for Wikipedia images
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx            # Hub entry point — routing between apps, DayHeader, widgets
│   ├── main.jsx           # React DOM mount
│   ├── supabase.js        # Supabase client initialization
│   ├── App.css
│   ├── index.css          # Tailwind base
│   ├── components/
│   │   └── TabBar.jsx     # Shared bottom navigation bar
│   ├── hooks/
│   │   └── useDarkMode.js # Dark mode toggle (localStorage)
│   └── apps/
│       ├── Flashcards/    # Mémoire de Singe
│       │   ├── index.jsx
│       │   ├── constants.js
│       │   ├── utils.js
│       │   ├── hooks/
│       │   │   ├── useMemoire.js       # Load decks, due cards, progress
│       │   │   ├── useStudySession.js  # Spaced repetition algorithm
│       │   │   └── useQuiz.js          # QCM quiz modes
│       │   ├── screens/               # 8 screens
│       │   └── components/            # FlipCard, ImageModal, UploadModal
│       ├── Meteo/
│       │   └── index.jsx              # 6-model weather aggregator
│       ├── Grimoire/
│       │   └── index.jsx              # Recipes, meal planning, shopping list
│       ├── Bisou/
│       │   └── index.jsx              # Emoji messaging
│       ├── Programme/
│       │   ├── index.jsx
│       │   ├── hooks/useProgramme.js
│       │   └── screens/               # HomeScreen, AddEventModal
│       └── Orbite/
│           ├── index.jsx              # Custom dark nav (no shared TabBar)
│           ├── hooks/useOrbite.js
│           └── screens/               # Dashboard, Log, History, Settings
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── package.json
├── SPECS.md               # Detailed specs per app (22KB, French)
└── README.md              # French overview
```

---

## Development Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

---

## Environment Variables

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=<supabase project url>
VITE_SUPABASE_ANON_KEY=<supabase anon key>
VITE_SPOONACULAR_KEY=<spoonacular api key>
```

All variables prefixed with `VITE_` are exposed to the browser bundle by Vite.
The Supabase anon key is safe to expose publicly (RLS enforces access control).

---

## Database Schema (Supabase)

### Core tables

**`profiles`** — User profiles (Be🐒 = profile 1, Princesse chat🚀 = profile 2)

**`decks`** — Flashcard decks
- `id`, `name`, `description`, `theme_id` (links to `THEMES` constant), `created_at`

**`cards`** — Individual cards
- `id`, `deck_id`, `front`, `back`, `image_path`

**`deck_criteria`** — Column definitions for a deck (multi-criterion model)
- `id`, `deck_id`, `name`, `type`, `question_title`, `position`, `interrogeable` (boolean), `quiz_answer_criterion_id` (self-ref for QCM answer column)

**`card_values`** — Cell values for each card × criterion
- `id`, `card_id`, `criterion_id`, `value` — unique constraint on `(card_id, criterion_id)`

**`card_progress`** — Spaced repetition progress per user per criterion
- `id`, `profile_id`, `card_id`, `criterion_id`, `level` (0–4), `next_review`, `last_reviewed`
- **RLS enabled** — filtered by `profile_id`

**`quiz_questions`** — Custom QCM questions
- `id`, `profile_id`, `question`, `answer`, `wrong_answers` (text[]), `theme`

**`bisou_messages`** — Emoji messages
- `id`, `profile_id`, `emoji`, `message` (max 140 chars), `created_at`

**`programme_events`** — Calendar events
- `id`, `title`, `emoji`, `event_date`, `event_time`, `note`, `is_annual`, `created_by`, `created_at`

**`orbite_activities`** — Sports activity logs
- `id`, `profile_id`, `type` (`walk`|`run`|`workout`), `value`, `unit`, `props` (converted points), `created_at`

**`orbite_settings`** — Per-user goals and conversion rates
- `profile_id` (PK), `daily_goal`, `weekly_rocket_target`, `rate_walk`, `rate_run_km`, etc.

**`grimoire_recipes`** — Saved recipes
- `id`, `name`, `ingredients` (jsonb), `instructions`, `source` (`manual`|`spoonacular`)

**`grimoire_meal_plan`** — Weekly meal planner
- `id`, `date`, `recipe_id`, `meal_type` (`breakfast`|`lunch`|`dinner`)

**`grimoire_settings`** — Pantry inventory
- `profile_id` (PK), `pantry` (jsonb)

### Key patterns
- Only `card_progress` has RLS. Other tables are shared between profiles.
- Profile selection is stored in `localStorage`, not Auth.

---

## Navigation Convention

**No React Router is used.** Each app manages navigation via a `screen` state string:

```jsx
const [screen, setScreen] = useState('home')
// ...
if (screen === 'study') return <StudyScreen onBack={() => setScreen('home')} />
```

**`<TabBar>`** — shared bottom nav component used by all apps except Orbite (which has its own custom dark nav):

```jsx
<TabBar
  tabs={TABS}        // array of { id, icon, label }
  active={tab}       // current active tab id
  onChange={setTab}  // callback
  color="indigo"     // accent color string (Tailwind)
  dark={dark}        // boolean
/>
```

Orbite has its own inline bottom nav with custom dark gradient styling.

---

## State Management

No global state library. State is split across:

| Storage | Used for |
|---------|----------|
| React `useState` | In-component transient UI state |
| Custom hooks | Data fetching + business logic per app |
| `localStorage` | Persistent preferences (dark mode, profile, deck settings, city) |
| `sessionStorage` | Translation cache in Grimoire (1-hour TTL) |
| Supabase | Persistent server-side data |

### Key localStorage keys

```
theme                               # "dark" | "light"
memoire-active-decks-{profileId}    # JSON array of active deck IDs
memoire-new-per-day-{deckId}        # number
memoire-done-today-{deckId}-{date}  # number
memoire-singe-quiz-sources          # JSON object (deck toggle map)
bbp-meteo-city-{profileId}          # city name string
bisou-last-seen-{profileId}         # ISO timestamp
```

---

## Spaced Repetition Algorithm (Mémoire de Singe)

Repetition operates at the **criterion level** (column), not the card level.

- **5 levels** (0–4): level 4 = mastered
- **Review intervals**: 1h → 8h → 24h → 72h (approximately)
- **Daily quota**: `memoire-new-per-day-{deckId}` new items per day
- Session built in `useStudySession.js`: filters due items, shuffles, tracks stats
- Study item = `{ card, criterion, currentValue, question_title }`

---

## External APIs

| API | Auth | Used in |
|-----|------|---------|
| Open-Meteo | None (free) | Météo — 6 models: AROME, ICON-D2, ICON-EU, Météo France, ECMWF, GFS |
| Spoonacular | `VITE_SPOONACULAR_KEY` | Grimoire — recipe search, nutrition |
| MyMemory | None (free) | Grimoire — EN→FR recipe translation |
| Wikipedia | Via `/api/proxy.js` | Flashcards — card images |

Wikipedia images are fetched server-side via `api/proxy.js` (Vercel serverless function) to avoid CORS issues.

---

## Image Handling

Card images are:
1. Compressed client-side via `utils.js` → `compressImage()` (max 800px, 0.7 quality, canvas-based)
2. Uploaded to Supabase Storage
3. `image_path` stored on the `cards` row
4. Displayed in `<FlipCard>` with `<ImageModal>` for full-screen view

---

## Theming & Dark Mode

- `useDarkMode()` hook reads/writes `localStorage.theme`
- Each app has an accent color (indigo, orange, etc.)
- Orbite uses a custom dark gradient theme separate from the main dark mode toggle
- Tailwind dark mode classes (`dark:bg-*`, `dark:text-*`) are used throughout

---

## App-Specific Notes

### Mémoire de Singe (Flashcards)
- Multi-criterion model: a deck is like a spreadsheet; each column is a criterion
- QCM modes: Duo (2 choices), Carré (4 choices), Cash (type-in)
- `interrogeable: true` on a criterion means it can be a question prompt
- `quiz_answer_criterion_id` links a criterion to its expected answer criterion for QCM

### Grimoire
- Recipes fetched from Spoonacular are translated EN→FR via MyMemory API
- Translations cached in `sessionStorage` with 1-hour TTL key: `grimoire_cache_*`
- Shopping list deduplicates against pantry items stored in `grimoire_settings.pantry`

### Orbite
- Activities are converted to **props** (points) using per-user conversion rates
- Two profiles compete weekly; winner is shown with a badge in History
- Has **custom bottom navigation** (not using shared `<TabBar>`)
- Sports types: `walk` (steps), `run` (km or min), `workout` (min or sessions)

### Programme
- Supports `is_annual: true` for recurring yearly events
- Events display with an emoji prefix
- Calendar uses a month-view component with day cells

### Bisou
- Messages capped at 140 characters
- New message badge on Hub uses `bisou-last-seen-{profileId}` to track unread count

---

## Coding Conventions

- **File naming**: PascalCase for components/screens (`StudyScreen.jsx`), camelCase for hooks/utils
- **Hooks**: all custom hooks live in `hooks/` subdirectory within each app
- **Screens**: all multi-screen apps have a `screens/` subdirectory
- **No default exports from index files** — each app's `index.jsx` exports its root component
- **Tailwind only** — no CSS modules, no styled-components; inline Tailwind classes everywhere
- **French UI** — all user-facing text is in French; code/variables are in English or French mixed
- **Comments**: minimal; code is mostly self-documenting

---

## Git Workflow

- Main branch: `main`
- Feature branches: `claude/<description>-<hash>` (used by AI assistants)
- Commits are in French (matching existing history style)
- No CI/CD pipeline beyond Vercel auto-deploy from `main`

---

## Deployment Notes

- Vercel auto-deploys from the `main` branch
- Serverless functions must be placed in `/api/` directory
- Environment variables must be set in Vercel dashboard (not committed)
- Build command: `vite build` → output to `dist/`

---

## Files to Know

| File | Why it matters |
|------|---------------|
| `src/App.jsx` | Hub entry, profile selection, widget layout, app routing |
| `src/supabase.js` | Single Supabase client instance — import this everywhere |
| `src/components/TabBar.jsx` | Reused nav in all apps except Orbite |
| `src/apps/Flashcards/hooks/useStudySession.js` | Core spaced repetition logic |
| `src/apps/Flashcards/constants.js` | THEMES, TABS, SCREENS constants |
| `SPECS.md` | Full product specifications (French) — consult before adding features |
| `api/proxy.js` | Vercel serverless function — only server-side code in the project |
