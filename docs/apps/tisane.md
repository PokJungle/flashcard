# 🍵 Tisane et Chauffeuse

App duo ciné/série pour décider quoi regarder ensemble, sans friction.

---

## Architecture

```
src/apps/Tisane/
├── index.jsx             # Composant principal + tabs
├── services/
│   └── tmdb.js           # Appels API TMDB
├── hooks/
│   ├── useWatchlist.js   # Watchlist Supabase + Realtime
│   └── useVetos.js       # Gestion jetons veto
└── screens/
    ├── WatchlistScreen.jsx  # Onglet Ma Liste
    ├── MatchScreen.jsx      # Onglet Match (swipe)
    └── DiscoverScreen.jsx   # Onglet Découvrir
```

---

## Variables d'environnement

| Variable              | Description              |
|-----------------------|--------------------------|
| `VITE_TMDB_API_KEY`   | Clé API TMDB v3          |
| `VITE_SUPABASE_URL`   | URL Supabase (existant)  |
| `VITE_SUPABASE_ANON_KEY` | Clé Supabase (existant) |

---

## Tables Supabase

### `tisane_watchlist`

Table partagée couple (pas de RLS).

| Colonne          | Type              | Notes                                      |
|------------------|-------------------|--------------------------------------------|
| `id`             | uuid PK           | gen_random_uuid()                          |
| `tmdb_id`        | integer           | ID TMDB                                    |
| `media_type`     | text              | `movie` ou `tv`                            |
| `title`          | text              |                                            |
| `poster_path`    | text              | Chemin relatif TMDB                        |
| `backdrop_path`  | text              | Chemin relatif TMDB                        |
| `overview`       | text              | Résumé (max 500 chars)                     |
| `vote_average`   | numeric(3,1)      | Note TMDB                                  |
| `release_year`   | integer           |                                            |
| `runtime`        | integer           | En minutes (films)                         |
| `seasons_count`  | integer           | Nombre de saisons (séries)                 |
| `added_by`       | text              | profile_id de l'ajouteur                   |
| `status`         | text              | `to_watch`, `matched`, `watching`, `watched`, `vetoed` |
| `liked_by`       | text[]            | IDs des profils ayant voté ❤️              |
| `passed_by`      | text[]            | IDs des profils ayant voté 😬              |
| `current_season` | integer           | Saison en cours (séries), défaut 1         |
| `current_episode`| integer           | Épisode en cours (séries), défaut 0        |
| `created_at`     | timestamptz       |                                            |

Contrainte unique : `(tmdb_id, media_type)`

### `tisane_vetos`

| Colonne         | Type    | Notes                          |
|-----------------|---------|--------------------------------|
| `id`            | uuid PK |                                |
| `profile_id`    | text    | Profil ayant utilisé le veto   |
| `watchlist_id`  | uuid FK | → tisane_watchlist(id)         |
| `used_at`       | timestamptz |                            |

---

## SQL de création (à exécuter dans Supabase)

```sql
CREATE TABLE IF NOT EXISTS tisane_watchlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title text NOT NULL,
  poster_path text,
  backdrop_path text,
  overview text,
  vote_average numeric(3,1) DEFAULT 0,
  release_year integer,
  runtime integer,
  seasons_count integer,
  added_by text NOT NULL,
  status text NOT NULL DEFAULT 'to_watch'
    CHECK (status IN ('to_watch', 'matched', 'watching', 'watched', 'vetoed')),
  liked_by text[] DEFAULT '{}',
  passed_by text[] DEFAULT '{}',
  current_season integer DEFAULT 1,
  current_episode integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tmdb_id, media_type)
);

CREATE TABLE IF NOT EXISTS tisane_vetos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id text NOT NULL,
  watchlist_id uuid REFERENCES tisane_watchlist(id) ON DELETE SET NULL,
  used_at timestamptz DEFAULT now()
);
```

---

## Logique métier

### Système de Match

1. Utilisateur A vote ❤️ → `liked_by` = `['A']`
2. Utilisateur B vote ❤️ → `liked_by` = `['A', 'B']` → `status = 'matched'`
3. Realtime Supabase notifie les deux écrans → overlay "Match !"

Le vote 😬 ajoute à `passed_by` (pour éviter la répétition en mode watchlist).  
Le vote ⏭️ ne persiste pas (juste passer à la carte suivante).

### Jetons Veto

- 3 jetons par utilisateur
- Chaque jeton utilisé se régénère après 7 jours
- L'utilisation d'un veto met `status = 'vetoed'` et retire le contenu de toutes les sessions

### Suivi Séries

- `current_season` / `current_episode` incrémentés via bouton "+"
- Statut passe automatiquement de `matched` → `watching` au premier épisode marqué vu

---

## Design

- **Fond** : Violet nuit `#0d0620`
- **Carte** : `#16082e`
- **CTA** : Ambre `#f59e0b`
- **Texte principal** : Blanc cassé `#f5f0ff`
- **Secondaire** : Violet clair `#a78bfa`
- Thème fixe (pas de toggle clair/sombre — l'ambiance ciné est toujours sombre)

---

## Fournisseurs streaming (France)

| ID TMDB | Nom           |
|---------|---------------|
| 8       | Netflix       |
| 119     | Amazon Prime  |
| 337     | Disney+       |
| 381     | Canal+        |
| 56      | OCS           |
| 350     | Apple TV+     |
| 1899    | Max           |
