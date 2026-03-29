# CLAUDE.md — Guide du projet Flashcard

Contexte essentiel pour les sessions IA. **Avant de travailler sur une app spécifique, lis le fichier `docs/apps/<app>.md` correspondant** (voir table ci-dessous).

---

## Vue d'ensemble

Plateforme multi-apps personnelle pour deux utilisateurs (Be🐒 / Princesse chat🚀), organisée autour d'un Hub central.

| App | Description | Doc |
|-----|-------------|-----|
| 🐒 **Mémoire de Singe** | Flashcards avec répétition espacée multi-critères | `docs/apps/flashcards.md` |
| 🌦️ **Parapluie ou Claquettes** | Météo agrégée multi-modèles | `docs/apps/meteo.md` |
| 📖 **Le Grimoire Gourmand** | Recettes saisonnières + planning repas | `docs/apps/grimoire.md` |
| 💌 **Bisou** | Messages emoji entre les deux profils | `docs/apps/bisou.md` |
| 🗞️ **Demandez le Programme** | Agenda partagé | `docs/apps/programme.md` |
| 💥 **Mise en Orbite** | Suivi sportif et défis entre profils | `docs/apps/orbite.md` |

Déployé : https://flashcard-ten-virid.vercel.app
GitHub : `pokjungle/flashcard`

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| UI | React 19 (JSX, pas de TypeScript) |
| Build | Vite 8 |
| CSS | Tailwind CSS 3 |
| Icônes | Lucide React |
| Base de données | Supabase (PostgreSQL + RLS) |
| Déploiement | Vercel (fonctions serverless dans `/api/`) |
| Package manager | npm |

**Pas de TypeScript** — tous les fichiers source sont en `.jsx` ou `.js`.
**Pas de React Router** — navigation manuelle via état `screen`.
**Pas de tests** — uniquement ESLint.

---

## Structure des fichiers

```
flashcard/
├── api/proxy.js              # Vercel serverless : proxy CORS pour images Wikipedia
├── src/
│   ├── App.jsx               # Hub — routing entre apps, DayHeader, widgets
│   ├── supabase.js           # Client Supabase (instance unique)
│   ├── components/
│   │   ├── TabBar.jsx        # Barre de navigation partagée (bas d'écran)
│   │   └── widgets/          # MeteoWidget, BisouWidget, AgendaWidget…
│   ├── hooks/useDarkMode.js
│   └── apps/
│       ├── Flashcards/       # hooks/ + screens/ + components/
│       ├── Meteo/
│       ├── Grimoire/
│       ├── Bisou/
│       ├── Programme/        # hooks/useProgramme.js + screens/
│       └── Orbite/           # hooks/useOrbite.js + screens/
├── docs/                     # Documentation détaillée par domaine
│   ├── apps/                 # flashcards.md, programme.md, grimoire.md…
│   ├── hub.md                # DayHeader, widgets, badges
│   ├── database.md           # Schéma complet Supabase
│   └── apis.md               # APIs externes
├── SPECS.md                  # Specs produit complètes
└── README.md
```

---

## Commandes de développement

```bash
npm run dev       # Serveur de dev (Vite HMR)
npm run build     # Build de production → dist/
npm run preview   # Prévisualiser le build en local
npm run lint      # Vérification ESLint
```

---

## Variables d'environnement

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...    # sûre à exposer (RLS protège les données)
VITE_SPOONACULAR_KEY=...
```

---

## Schéma BDD (résumé)

Voir `docs/database.md` pour le schéma complet. Tables principales :

| Table | App | RLS |
|-------|-----|-----|
| `profiles` | Hub | — |
| `decks`, `cards`, `deck_criteria`, `card_values` | Flashcards | non |
| `card_progress` | Flashcards | **oui** (par `profile_id`) |
| `quiz_questions` | Flashcards | non |
| `bisou_messages` | Bisou | non |
| `programme_events` | Programme | non |
| `orbite_activities`, `orbite_settings` | Orbite | non |
| `grimoire_recipes`, `grimoire_meal_plan`, `grimoire_settings` | Grimoire | non |

Profil sélectionné via `localStorage` (`flashcard-profile`), pas via Supabase Auth.

---

## Navigation — conventions

**Pattern TabBar en bas :**

```jsx
<TabBar tabs={TABS} active={tab} onChange={setTab} color="#6366f1" dark={dark} />
```

| App | Couleur | Notes |
|-----|---------|-------|
| 🐒 Mémoire | `#4f46e5` indigo | badge dues |
| 📖 Grimoire | `#f97316` orange | 3 onglets |
| 🗞️ Programme | `#6366f1` indigo | |
| 💥 Orbite | dark custom | nav custom intentionnelle |
| 💌 Bisou / 🌦️ Météo | — | écran unique |

**Pas de React Router.** Navigation via état `screen` :

```jsx
const [screen, setScreen] = useState('home')
if (screen === 'study') return <StudyScreen onBack={() => setScreen('home')} />
```

---

## Gestion d'état

| Stockage | Utilisé pour |
|----------|-------------|
| React `useState` | État UI transient |
| Hooks custom | Fetch + logique métier par app |
| `localStorage` | Préférences persistantes |
| `sessionStorage` | Cache traductions Grimoire (TTL 1h) |
| Supabase | Données serveur persistantes |

Clés localStorage détaillées dans chaque `docs/apps/*.md`.

---

## Conventions de code

- **Nommage** : PascalCase composants/screens, camelCase hooks/utils
- **Hooks** : sous-dossier `hooks/` propre à chaque app
- **Screens** : sous-dossier `screens/` pour les apps multi-écrans
- **CSS** : Tailwind uniquement
- **Langue UI** : tout le texte affiché en français
- **Commits** : messages en français

---

## Git & Déploiement

- Branche principale : `main` → Vercel auto-déploie
- Branches features IA : `claude/<description>-<hash>`
- Variables d'env : dashboard Vercel uniquement (ne pas committer)

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/App.jsx` | Hub — sélection profil, widgets, routing apps |
| `src/supabase.js` | Instance Supabase unique |
| `src/components/TabBar.jsx` | Nav partagée |
| `src/apps/Flashcards/hooks/useStudySession.js` | Algo répétition espacée |
| `src/apps/Programme/hooks/useProgramme.js` | Utilitaires dates/agenda |
| `api/proxy.js` | Seul code serveur (proxy Wikipedia) |
| `SPECS.md` | Specs produit — consulter avant d'ajouter une feature |

---

## Apps en préparation

| App | Concept |
|-----|---------|
| 🍷 **Canon** | Cave à vin + journal de dégustation |
| 🍵 **Tisane et Chauffeuse** | Films/séries à regarder ensemble |
| 🐌 **Ça Traîne** | Todo partagée avec priorités croisées |
| 🎸 **Jukebox** | Morceaux partagés + humeur musicale |
| 👣 **Nos Empreintes** | Carte des lieux visités ensemble |
| 💧 **Arrose-moi** | Suivi arrosage des plantes |
| 🌙 **Parenthèse** | Planification soirées/activités couple |

Specs détaillées dans `SPECS.md`. Tables Supabase prévues dans `docs/database.md`.
