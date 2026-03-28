# CLAUDE.md — Guide du projet Flashcard

Ce fichier fournit le contexte essentiel pour les assistants IA qui travaillent sur cette codebase.
**Consulter aussi `SPECS.md` avant d'ajouter une fonctionnalité** — il contient les specs détaillées de chaque app.

---

## Vue d'ensemble

Plateforme multi-apps personnelle pour deux utilisateurs (Be🐒 / Princesse chat🚀), organisée autour d'un Hub central. 6 apps en production, ~7 en préparation.

| App | Description |
|-----|-------------|
| 🐒 **Mémoire de Singe** | Flashcards avec répétition espacée multi-critères |
| 🌦️ **Parapluie ou Claquettes** | Météo agrégée multi-modèles |
| 📖 **Le Grimoire Gourmand** | Recettes saisonnières + planning repas |
| 💌 **Bisou** | Messages emoji entre les deux profils |
| 🗞️ **Demandez le Programme** | Agenda partagé |
| 💥 **Mise en Orbite** | Suivi sportif et défis entre profils |

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
├── api/
│   └── proxy.js          # Vercel serverless : proxy CORS pour images Wikipedia
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx            # Hub — routing entre apps, DayHeader, widgets
│   ├── main.jsx           # Point d'entrée React
│   ├── supabase.js        # Client Supabase (instance unique)
│   ├── App.css
│   ├── index.css          # Base Tailwind
│   ├── components/
│   │   └── TabBar.jsx     # Barre de navigation partagée (bas d'écran)
│   ├── hooks/
│   │   └── useDarkMode.js # Toggle dark mode (localStorage)
│   └── apps/
│       ├── Flashcards/    # Mémoire de Singe
│       │   ├── index.jsx
│       │   ├── constants.js       # THEMES, TABS, SCREENS, QUIZ_SOURCES_KEY
│       │   ├── utils.js           # compressImage()
│       │   ├── hooks/
│       │   │   ├── useMemoire.js         # Chargement decks + dues + progression
│       │   │   ├── useStudySession.js    # Algo répétition espacée
│       │   │   └── useQuiz.js            # Session QCM Duo/Carré/Cash
│       │   ├── screens/
│       │   │   ├── HomeMemoire.jsx
│       │   │   ├── HomeQuiz.jsx
│       │   │   ├── StudyScreen.jsx
│       │   │   ├── SessionEnd.jsx
│       │   │   ├── QuizScreen.jsx
│       │   │   ├── QuizEnd.jsx
│       │   │   ├── ManageDeck.jsx
│       │   │   └── ManageQuestions.jsx
│       │   └── components/
│       │       ├── FlipCard.jsx
│       │       ├── ImageModal.jsx
│       │       └── UploadModal.jsx
│       ├── Meteo/
│       │   └── index.jsx              # Météo multi-modèles
│       ├── Grimoire/
│       │   └── index.jsx              # Recettes, planning, liste de courses
│       ├── Bisou/
│       │   └── index.jsx              # Messages emoji
│       ├── Programme/
│       │   ├── index.jsx
│       │   ├── hooks/useProgramme.js
│       │   └── screens/
│       │       ├── HomeScreen.jsx     # ListView + MonthView (prop view)
│       │       └── AddEventModal.jsx
│       └── Orbite/
│           ├── index.jsx              # Nav dark custom (pas de TabBar partagé)
│           ├── hooks/useOrbite.js
│           └── screens/
│               ├── DashboardScreen.jsx
│               ├── LogScreen.jsx
│               ├── HistoryScreen.jsx
│               └── SettingsScreen.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── package.json
├── SPECS.md               # Specs détaillées par app (en français)
└── README.md              # Vue d'ensemble (en français)
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

Fichier `.env` à la racine :

```
VITE_SUPABASE_URL=<url du projet supabase>
VITE_SUPABASE_ANON_KEY=<clé anon supabase>
VITE_SPOONACULAR_KEY=<clé api spoonacular>
```

Toutes les variables `VITE_*` sont exposées dans le bundle navigateur par Vite.
La clé anon Supabase est sûre à exposer (RLS protège les données).

---

## Schéma de base de données (Supabase)

### Tables

**`profiles`** — Profils utilisateurs (Be🐒 / Princesse chat🚀)

**`decks`** — Decks de flashcards
- `id`, `name`, `description`, `theme_id` (lié à la constante `THEMES`), `created_at`

**`cards`** — Cartes individuelles
- `id`, `deck_id`, `front` (nullable), `back` (nullable), `image_path`

**`deck_criteria`** — Colonnes/critères d'un deck (modèle multi-critères)
- `id`, `deck_id`, `name`, `type`, `question_title`, `position`
- `interrogeable boolean default true` — si false, ce critère n'est jamais posé en question
- `quiz_answer_criterion_id uuid` — référence self (critère réponse pour le QCM)
- RLS désactivé

**`card_values`** — Valeurs par carte × critère
- `id`, `card_id`, `criterion_id`, `value` — contrainte unique `(card_id, criterion_id)`
- RLS désactivé

**`card_progress`** — Progression répétition espacée par profil × carte × critère
- `id`, `profile_id`, `card_id`, `criterion_id`, `level` (0–4), `next_review`, `last_reviewed`
- **RLS activé** — filtré par `profile_id`

**`quiz_questions`** — Questions QCM libres
- `id`, `profile_id`, `question`, `answer`, `wrong_answers text[]`, `theme`
- RLS désactivé

**`bisou_messages`**
- `id`, `profile_id`, `emoji`, `message` (max 140 chars), `created_at`

**`programme_events`**
- `id`, `title`, `emoji` (default '📅'), `event_date`, `event_time`, `note`, `is_annual boolean`, `created_by`, `created_at`

**`orbite_activities`**
- `id`, `profile_id`, `type` (`walk`|`run`|`workout`), `value`, `unit`, `props` (points convertis), `created_at`

**`orbite_settings`**
- `profile_id` (PK), `daily_goal` (def 1000), `weekly_rocket_target` (def 10000)
- `rate_walk`, `rate_run_km`, `rate_run_min`, `rate_workout_min`, `rate_workout_sessions`

**`grimoire_recipes`**
- `id`, `name`, `ingredients` (jsonb), `instructions`, `source` (`manual`|`spoonacular`)

**`grimoire_meal_plan`**
- `id`, `date`, `recipe_id`, `meal_type` (`breakfast`|`lunch`|`dinner`)

**`grimoire_settings`**
- `profile_id` (PK), `pantry` (jsonb)

### Règles importantes
- Seule `card_progress` a RLS actif. Les autres tables sont partagées entre profils.
- La sélection de profil est en `localStorage`, pas via Supabase Auth.

---

## Navigation — conventions

**Pattern unifié : TabBar en bas (Option C)**

```jsx
<TabBar
  tabs={TABS}        // array de { id, emoji, label, badge? }
  active={tab}
  onChange={setTab}
  color="indigo"     // couleur d'accentuation Tailwind
  dark={dark}
/>
```

| App | Onglets | Couleur | Notes |
|-----|---------|---------|-------|
| 🐒 Mémoire | Mémoire 🧠 / Quiz ⚡ | `#4f46e5` indigo | badge dues sur Mémoire |
| 📖 Grimoire | Inspiration 💡 / Grimoire 📖 / Semaine 📅 | `#f97316` orange | TabBar même sur vue détail |
| 🗞️ Programme | Liste 📋 / Mois 🗓️ | `#6366f1` indigo | state `view` dans index.jsx |
| 💥 Orbite | Mission / Logger / Historique / Réglages | dark custom | nav custom intentionnelle — thème spatial |
| 💌 Bisou | — | — | écran unique, pas de tabs |
| 🌦️ Météo | — | — | écran unique, pas de tabs |

**Pas de React Router.** Chaque app gère la navigation via un état `screen` :

```jsx
const [screen, setScreen] = useState('home')
if (screen === 'study') return <StudyScreen onBack={() => setScreen('home')} />
```

---

## Hub (App.jsx)

### Layout

```
DayHeader (centré, max-w-lg)
─────────────────────────────────────────────
[ Météo 170px ] [ Bisou flex-1          ] | Orbite 64px
[ 🛒 48px     ] [ Agenda flex-1         ] | (toute hauteur)
─────────────────────────────────────────────
Grille apps 4 colonnes (sans Bisou)
En préparation (grid 2 cols)
```

### DayHeader
- Greeting selon l'heure : Bonjour / Bonne après-midi / Bonsoir / Bonne nuit + avatar profil
- Date complète en français, centré, `max-w-lg mx-auto px-3`
- Fête du jour : calendrier statique 366 jours intégré (pas d'API)
- **Fêtes normales** : texte 10px discret `#c4b5fd`, sans emoji
- **Fêtes spéciales** : bannière fond doré `linear-gradient(135deg,#b45309,#d97706,#f59e0b)`, texte blanc 15px, 36 confettis CSS animés

Fêtes spéciales (array `FETES_SPECIALES`, facile à étendre) :
```js
{ nom:'Marie', icon:'❤️‍🔥' }        // 15 août
{ nom:'Benoît', icon:'🐵' }          // 11 juillet
{ nom:'Patrick', icon:'🍀' }         // 17 mars
{ nom:'Valentin', icon:'💝' }        // 14 février
{ nom:'Noël', icon:'🎄' }            // 25 décembre
{ nom:"Jour de l'an", icon:'🥂' }   // 1er janvier
{ nom:'Fête Nationale', icon:'🎆' } // 14 juillet
{ nom:'Pâques', icon:'🥚' }         // mobile — ⚠️ à mettre à jour chaque année
// + autres (voir App.jsx)
```

### Widgets

**MeteoWidget** (170px) — fond `#4f3ea0`, icône WMO, temp moy 34px, min/max, pluie+vent, conseil parapluie/claquettes (seuil vent 40 km/h). Ville par profil via `localStorage bbp-meteo-city-{profileId}`.

**BisouWidget** — dernier message de l'AUTRE profil. Emoji seul → 38px centré ; avec texte → emoji 22px + expéditeur + 3 lignes. Pastille 💗 si non lu.

**CoursesWidget** (48px) — fond post-it `#fef9c3`. Clic → `openApp('recettes', { initialShoppingList: true })`. Point orange si items dans le meal_plan de la semaine.

**AgendaWidget** — prochain événement `programme_events`, gère `is_annual`. Compte à rebours amber si ≤ 3 jours.

**OrbiteWidget** (64px, toute hauteur) — jauge verticale bicolore orange🐒/bleu🚀. Affiché uniquement si données semaine en cours.

---

## Gestion d'état

Pas de librairie de state global. État réparti :

| Stockage | Utilisé pour |
|----------|-------------|
| React `useState` | État UI transient |
| Hooks custom | Fetch + logique métier par app |
| `localStorage` | Préférences persistantes |
| `sessionStorage` | Cache traductions Grimoire (TTL 1h) |
| Supabase | Données serveur persistantes |

### Clés localStorage complètes

```
theme                                    # "dark" | "light"
memoire-active-decks-{profileId}         # JSON array d'IDs de decks actifs
memoire-new-per-day-{deckId}             # quota nouvelles cartes/jour (défaut 10)
memoire-new-seen-{deckId}-{date}         # nouvelles cartes vues aujourd'hui (reset auto)
memoire-done-today-{deckId}-{date}       # questions faites aujourd'hui (reset auto)
memoire-session-mode-{deckId}            # dernier mode choisi (rapide/normal/marathon)
memoire-singe-quiz-sources               # JSON object (toggle sources Quiz)
bbp-meteo-city-{profileId}              # nom de ville météo
bisou-last-seen-{profileId}             # ISO timestamp dernier message lu
```

---

## Algorithme de répétition espacée (Mémoire de Singe)

La répétition opère au niveau du **critère** (colonne), pas de la carte.

- **5 niveaux** (0–4) : level 4 = maîtrisé (`level >= 4` après 2× Facile)
- **Intervalles** : ~1h → 8h → 24h → 72h
- **Quota journalier** : `memoire-new-per-day-{deckId}`, options 5/10/20/∞
- **Calcul du badge** : `min(quota - faites aujourd'hui, à faire + jamais vues dispo)` → 0 si quota atteint
- **Session** : 1 critère par carte par session (aléatoire), limite en questions (pas en items)
- **Modes de lancement** : 🐇 10 / 🐒 20 / 🐘 MAX questions
- `interrogeable: false` → utilisé uniquement comme réponse, jamais comme question
- Révélation en place (fade), lien Wikipedia disponible

### Import de decks

Format JSON supporté :
```json
// Format classique
[{ "front": "...", "back": "..." }]

// Format multi-critères
{
  "criteria": [{ "name": "...", "type": "text", "position": 0 }],
  "values": [{ "criterion_0": "valeur", "criterion_1": "valeur" }]
}
```

### Quiz QCM

- **Duo** 1pt / **Carré** 3pts / **Cash** 5pts (saisie libre)
- Cash : distance de Levenshtein dynamique, réponses partielles, retour "Presque !"
- Paires via `quiz_answer_criterion_id` dans `deck_criteria`
- Diversification par thème (round-robin)
- Questions libres avec `wrong_answers[]` manuelles (min 2 requises)

---

## APIs externes

| API | Auth | Utilisée dans |
|-----|------|---------------|
| Open-Meteo | Aucune (gratuite) | Météo — 6 modèles : AROME, ICON-D2, ICON-EU, Météo France, ECMWF, GFS |
| Spoonacular | `VITE_SPOONACULAR_KEY` | Grimoire — recherche recettes, nutrition |
| MyMemory | Aucune (gratuite) | Grimoire — traduction EN→FR des recettes |
| Wikipedia | Via `/api/proxy.js` | Flashcards — images de cartes |

Les images Wikipedia sont récupérées côté serveur via `api/proxy.js` pour éviter les problèmes CORS.

---

## Gestion des images (Flashcards)

1. Compression côté client via `utils.js → compressImage()` (max 800px, qualité 0.7, canvas)
2. Upload dans Supabase Storage
3. `image_path` stocké sur la ligne `cards`
4. Affiché dans `<FlipCard>` avec `<ImageModal>` pour vue plein écran

---

## Thème & Dark Mode

- `useDarkMode()` lit/écrit `localStorage.theme`
- Chaque app a sa couleur d'accentuation (indigo, orange…)
- Orbite utilise un thème dark gradient personnalisé (thème spatial intentionnel)
- Classes Tailwind dark mode (`dark:bg-*`, `dark:text-*`) utilisées partout

---

## Notes par app

### 🐒 Mémoire de Singe
- Modèle multi-critères : un deck est comme un tableur, chaque colonne est un critère
- `interrogeable: false` → réponse uniquement, jamais posée en question
- `quiz_answer_criterion_id` lie un critère à son critère-réponse pour le QCM
- ManageDeck : gestion quota, création/suppression critères et cartes
- SessionEnd : récap session + progression complète du deck par critère

### 📖 Grimoire
- `initialShoppingList: true` dans les props → ouvre directement l'onglet Semaine + modal courses
- Cache sessionStorage clé `grimoire_cache_*` avec TTL 1h pour les traductions
- Liste de courses : déduplique contre le placard (`grimoire_settings.pantry`)

### 💥 Orbite
- Les activités sont converties en **Props 🚀** (points) via taux configurables par profil
- Compétition hebdo Be🐒 vs Princesse🚀 avec badge vainqueur dans l'historique
- **Nav custom dark** (pas de `<TabBar>` partagé) — thème spatial intentionnel
- Types d'activités : `walk` (pas), `run` (km ou min), `workout` (min ou séances)
- Streak 🔥 : jours consécutifs où l'objectif journalier est atteint
- Mission décollage 💥 : barre fusée commune, objectif configurable

### 🗞️ Programme
- `is_annual: true` pour les récurrences annuelles (anniversaires…)
- Vue Liste : événements à venir triés, section "🔥 Très bientôt" si ≤ 3 jours
- Vue Mois : navigation mois, pastilles événements, détail au clic
- **Améliorations prévues** : modifier un événement, badge hub, afficher l'âge pour anniversaires

### 💌 Bisou
- Messages limités à 140 caractères
- Badge 💗 animé sur la tuile hub si message non lu de l'autre profil

---

## Apps en préparation (SPECS.md section "Apps à construire")

| App | Concept |
|-----|---------|
| 🍷 **Canon** | Cave à vin partagée + journal de dégustation (API Wine-Searcher) |
| 🍵 **Tisane et Chauffeuse** | Films/séries à regarder ensemble (API TMDB) |
| 🐌 **Ça Traîne** | Todo partagée avec priorités croisées |
| 🎸 **Jukebox** | Morceaux partagés + humeur musicale |
| 👣 **Nos Empreintes** | Carte des lieux visités ensemble |
| 💧 **Arrose-moi** | Suivi arrosage des plantes |
| 🌙 **Parenthèse** | Planification soirées/activités couple |

Les tables Supabase prévues pour Canon sont dans `SPECS.md` (tables `canon_bottles`, `canon_tastings`).

---

## Conventions de code

- **Nommage** : PascalCase pour composants/screens (`StudyScreen.jsx`), camelCase pour hooks/utils
- **Hooks** : dans un sous-dossier `hooks/` propre à chaque app
- **Screens** : dans un sous-dossier `screens/` pour les apps multi-écrans
- **CSS** : Tailwind uniquement — pas de CSS modules, pas de styled-components
- **Langue UI** : tout le texte affiché est en français
- **Commentaires** : minimaux, le code est majoritairement auto-documenté
- **Commits** : messages en français (convention du repo)

---

## Git & Déploiement

- Branche principale : `main` → Vercel auto-déploie
- Branches features IA : `claude/<description>-<hash>`
- Fonctions serverless : dans `/api/` (Vercel)
- Variables d'environnement : à configurer dans le dashboard Vercel (ne pas committer)

---

## Fichiers clés à connaître

| Fichier | Pourquoi |
|---------|----------|
| `src/App.jsx` | Hub principal — sélection profil, widgets, routing vers les apps |
| `src/supabase.js` | Instance unique du client Supabase — à importer partout |
| `src/components/TabBar.jsx` | Nav réutilisée dans toutes les apps sauf Orbite |
| `src/apps/Flashcards/hooks/useStudySession.js` | Logique centrale de répétition espacée |
| `src/apps/Flashcards/constants.js` | Constantes THEMES, TABS, SCREENS |
| `SPECS.md` | Specs produit complètes — consulter avant d'ajouter une feature |
| `api/proxy.js` | Seul code serveur du projet (proxy Wikipedia) |
