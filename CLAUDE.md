# CLAUDE.md — Guide Claude Code

**Lis `docs/apps/<app>.md` avant toute modification d'app.**

---

## @Architecture

**Vision** : Plateforme multi-apps personnelle pour 2 utilisateurs (Be🐒 / Princesse chat🚀) autour d'un Hub central. 6 apps en production, apps en préparation dans `docs/specs.md`.

**Tech Stack** :
- UI : React 19 (JSX uniquement, PAS de TypeScript)
- Build : Vite 8 + Tailwind CSS 3
- BDD : Supabase (PostgreSQL + RLS)
- Déploiement : Vercel (serverless dans `/api/`)

**Structure clé** :
```
src/
├── App.jsx              # Hub principal — routing apps
├── supabase.js          # Client Supabase unique
├── components/
│   ├── TabBar.jsx       # Navigation partagée
│   └── widgets/         # Widgets hub
└── apps/               # Apps (hooks/ + screens/)
docs/                   # Documentation détaillée
api/proxy.js            # Proxy CORS Wikipedia
```

---

## @Commands

```bash
npm run dev        # Serveur de dev (Vite HMR)
npm run build      # Build production → dist/
npm run lint       # ESLint vérification
npm run preview    # Prévisualiser build local
```

**Pas de tests unitaires** — uniquement ESLint.

---

## @Conventions

**React** : 
- Utiliser des composants fonctionnels (PascalCase)
- Navigation via état `screen` (PAS de React Router)
- Hooks dans sous-dossier `hooks/` propre à chaque app

**Code** :
- Fichiers : `.jsx` pour composants, `.js` pour utilitaires
- Nommage : PascalCase composants/screens, camelCase hooks/utils
- CSS : Tailwind uniquement (PAS de CSS modules, PAS de styled-components)
- Langue UI : tout le texte affiché en français
- Commits : messages en français

**État** :
- React `useState` → état UI transient
- Hooks custom → logique métier + fetch
- `localStorage` → préférences persistantes
- Supabase → données serveur

**Navigation** :
```jsx
<TabBar tabs={TABS} active={tab} onChange={setTab} color="#6366f1" dark={dark} />
```

---

## @Rules

**Obligations absolues** :
- Toujours lire `docs/apps/<app>.md` avant modifier une app
- Utiliser uniquement les variables d'env `VITE_*` (dashboard Vercel)
- Profil sélectionné via `localStorage` (`flashcard-profile`), PAS Supabase Auth
- Toute modification BDD doit respecter le schéma dans `docs/database.md`

**Interdictions absolues** :
- NE PAS utiliser TypeScript
- NE PAS utiliser React Router
- NE PAS committer de clés d'API ou variables d'env
- NE PAS modifier le dossier `/dist` (généré automatiquement)
- NE PAS ajouter de dépendances sans justification

**RLS Supabase** :
- Seule table `card_progress` a RLS actif (filtrée par `profile_id`)
- Toutes autres tables sont partagées entre les 2 profils

**Déploiement** :
- Branche `main` → Vercel auto-déploie
- Features IA : `claude/<description>-<hash>`
- Serverless uniquement dans `/api/`
