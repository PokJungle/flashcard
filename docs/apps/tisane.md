# 🍵 Tisane et Chauffeuse

App duo ciné/série pour décider quoi regarder ensemble, sans friction.

---

## Architecture

```
src/apps/Tisane/
├── index.jsx                # Composant principal + tabs
├── services/
│   └── tmdb.js              # Appels API TMDB
├── hooks/
│   ├── useWatchlist.js      # Watchlist Supabase + Realtime + vote logic
│   ├── useVetos.js          # Jetons veto (3 par profil, regen 7j)
│   └── useSeriesSync.js     # Sync TMDB pour séries (épisodes, statut diffusion)
└── screens/
    ├── WatchlistScreen.jsx  # Onglet Ma Liste
    ├── MatchScreen.jsx      # Onglet Match (swipe + pré-session)
    └── DiscoverScreen.jsx   # Onglet Découvrir + Admin panel
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
| `status`         | text              | Voir machine d'états ci-dessous            |
| `liked_by`       | text[]            | IDs des profils ayant voté ❤️              |
| `passed_by`      | text[]            | IDs des profils ayant voté 😬 (soft dislike) |
| `disliked_at`    | jsonb             | `{profileId: isoTimestamp}` — pour cooldown 90j |
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

## Migration (à exécuter dans Supabase SQL Editor)

```sql
-- Ajout colonne disliked_at pour cooldown 90j
ALTER TABLE tisane_watchlist
  ADD COLUMN IF NOT EXISTS disliked_at jsonb DEFAULT '{}'::jsonb;

-- Mise à jour contrainte status pour inclure 'conflicted'
ALTER TABLE tisane_watchlist
  DROP CONSTRAINT IF EXISTS tisane_watchlist_status_check;
ALTER TABLE tisane_watchlist
  ADD CONSTRAINT tisane_watchlist_status_check
  CHECK (status IN ('to_watch', 'matched', 'watching', 'watched', 'vetoed', 'conflicted'));
```

## SQL de création complète

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
    CHECK (status IN ('to_watch', 'matched', 'watching', 'watched', 'vetoed', 'conflicted')),
  liked_by text[] DEFAULT '{}',
  passed_by text[] DEFAULT '{}',
  disliked_at jsonb DEFAULT '{}'::jsonb,
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

### Machine d'états (statuts)

```
to_watch ──❤️❤️──→ matched
to_watch ──❤️+😬─→ conflicted
to_watch ──veto──→ vetoed

matched ──+ep────→ watching
matched ──veto──→ vetoed

watching ──done──→ watched
watching ──veto──→ vetoed

conflicted ──admin↺──→ to_watch (reset votes)
```

### Visibilité par statut

| Statut       | Ma Liste              | Match Deck                 | Admin |
|--------------|-----------------------|----------------------------|-------|
| `to_watch`   | ❌                   | ✅ P1 si partenaire a liké | ✅    |
| `matched`    | ✅ groupe Matchs      | ❌ (déjà voté)             | ✅    |
| `watching`   | ✅ groupe En cours    | ❌                         | ✅    |
| `watched`    | ✅ groupe Vus         | ❌                         | ✅    |
| `vetoed`     | ❌                   | ❌                         | ✅ lecture seule |
| `conflicted` | ❌                   | ❌                         | ✅ + Ressusciter |

### Vote Logique

| Vote | Source | Action DB | Effet |
|------|--------|-----------|-------|
| ❤️ Swipe droit | P1 watchlist | `vote(id, 'heart')` | → `matched` si partenaire a liké |
| ❤️ Swipe droit | P2 catalogue | `addAndVote(item, 'heart')` | upsert `to_watch` + `liked_by: [moi]` → P1 chez partenaire |
| 😬 Swipe gauche | P1 watchlist | `vote(id, 'later')` | → `conflicted` (partenaire a liké) + timestamp 90j |
| 😬 Swipe gauche | P2 catalogue | `addAndVote(item, 'later')` | upsert + `passed_by: [moi]` + timestamp 90j |
| ⏭️ Skip | P1 ou P2 | aucune écriture | Réapparaît à la prochaine session |
| ➕ Bouton Découvrir | catalogue | `addItem(item)` | upsert + vote ❤️ → `to_watch` + P1 chez partenaire |
| 🚫 Veto | Ma Liste | `vetoItem(id)` + jeton | → `vetoed`, permanent pour les deux |

**Conflit** : si A ❤️ et B 😬 → `status = 'conflicted'`. Caché des deux. Résurrection uniquement via Admin (↺ reset tous les votes).

**Cooldown 90j** : items dans `passed_by` réapparaissent dans le deck après 90 jours. Vérification côté client via `disliked_at[profileId]`.

### Jetons Veto

- 3 jetons par utilisateur (table `tisane_vetos`)
- Chaque jeton utilisé se régénère après 7 jours (calcul client sur `used_at`)
- Veto = `status: 'vetoed'` + hard permanent pour les deux profils

### Suivi Séries (`useSeriesSync.js`)

- Sync TMDB à chaque ouverture : récupère nb d'épisodes réels par saison, date prochain épisode
- Cache sessionStorage `tisane-series-sync-v1`, TTL 4h, clé `${tmdbId}:${currentSeason}`
- Badges "Nouvel épisode" : ne s'affichent que si `air_date > lastVisitMs` (localStorage par profil)
- `current_season` clampé à `number_of_seasons` pour éviter les 404 TMDB
- Auto-avancement saison : si `current_episode >= episodesInSeason` → saison suivante

---

## Écrans

### Ma Liste (WatchlistScreen)

Groupes affichés : **Matchs** (`matched`) + **En cours** (`watching`) + **Vus** (`watched`)

Actions disponibles par item :
- Séries : compteur S/E éditable, bouton `+` (avance épisode, bloqué si pas encore sorti), `S+` en fin de saison
- **Terminer** → `watched`
- **Supprimer** → hard DELETE (gratuit, double confirmation)
- **Veto** 🚫 → `vetoed` (consomme 1 jeton, affiche solde)

### Match (MatchScreen)

**Pré-session** (avant de lancer le deck) :
- Toggle Films / Séries
- Chips genre (Action, Comédie, Drame, Horreur, etc.)
- Options films : Ce soir (<1h40) | En salle (now playing FR)
- Bouton "Commencer le match ⚡" + teaser P1 si items en attente

**Session** :
- File unifiée : **P1** (partenaire a liké, mon vote attendu) → **P2** (catalogue TMDB)
- Deck infini : batches de 20, auto-fetch page suivante quand < 5 cartes restantes
- Catalogue : streaming flatrate FR, `vote_average ≥ 6.0`, `vote_count ≥ 100`, trié par note
- Exclusion : items déjà votés (❤️ ou 😬 < 90j)
- Carte face A : backdrop, titre, note, runtime, badge "❤️ partenaire" si P1
- Carte face B (tap) : synopsis, casting, plateformes streaming FR
- Bouton ← pour revenir au menu pré-session

### Découvrir (DiscoverScreen)

**Mode Catalogue** (défaut) :
- Recherche TMDB avec debounce 400ms
- Toggle Films / Séries + chips genre
- Badge statut sur les posters des items déjà en DB (À voter / Matchée / En cours)
- Bouton `+` : upsert + vote ❤️ (pas force-match ; attend le vote partenaire)

**Mode Admin** (bouton Settings en haut) :
- Liste tous les items en DB (tous statuts, y compris vetoed et conflicted)
- Filtres : Tous | À voter | Matchés | En cours | Vus | Conflits | Vetoed
- Actions :
  - ⚡ Force Match (`to_watch` → `matched`)
  - ▶ En cours (`to_watch`/`matched` → `watching`)
  - ↺ Ressusciter (`conflicted` → `to_watch`, reset tous les votes)
  - 🗑 Supprimer (hard DELETE, double-tap, désactivé sur `vetoed`)

---

## Design

- **Fond** : Violet nuit `#0d0620`
- **Carte** : `#16082e`
- **Bordure** : `#2d1059`
- **CTA** : Ambre `#f59e0b`
- **Action** : Violet `#7c3aed`
- **Succès** : Vert `#10b981`
- **Texte principal** : Blanc cassé `#f5f0ff`
- **Secondaire** : Violet clair `#a78bfa`
- **Muted** : `#6b4fa0`
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

