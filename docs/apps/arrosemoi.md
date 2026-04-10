# Arrose-moi 💧

App de suivi d'arrosage des plantes. Rappelle quelles plantes ont besoin d'eau selon leur fréquence configurée.

## Architecture des fichiers

```
src/apps/ArroseMoi/
├── index.jsx                   # Composant principal, modal ajout/édition, ASTUCES
├── hooks/
│   ├── usePlantes.js           # CRUD plantes + realtime Supabase
│   └── useWaterings.js         # Arrosages + calcul urgence + realtime
└── screens/
    ├── PlanningScreen.jsx      # Vue planning groupée par urgence
    ├── PlantesScreen.jsx       # Liste complète des plantes
    └── HistoriqueScreen.jsx    # 20 derniers arrosages
```

## Tables SQL

```sql
CREATE TABLE IF NOT EXISTS arrose_plantes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           text NOT NULL,
  emoji         text NOT NULL DEFAULT '🪴',
  piece         text NOT NULL DEFAULT 'Salon',
  frequence_j   integer NOT NULL DEFAULT 7,
  note          text,
  added_by      text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS arrose_waterings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plante_id     uuid NOT NULL REFERENCES arrose_plantes(id) ON DELETE CASCADE,
  arrose_par    text NOT NULL,
  arrose_le     timestamptz NOT NULL DEFAULT now()
);
```

Pas de RLS sur ces tables — partagées entre les 2 profils.

## Logique urgence

```
joursDepuis = Math.floor((Date.now() - lastWateredAt) / 86_400_000)
ratio = joursDepuis / plante.frequence_j

'retard'  si ratio >= 1.0 (ou jamais arrosée)
'bientot' si ratio >= 0.75
'ok'      sinon
```

Couleurs :
- `retard` : `#ef4444` (rouge)
- `bientot` : `#f59e0b` (ambre)
- `ok` : `#22c55e` (vert)

## Pas d'API externe

Toutes les données sont stockées dans Supabase. Pas d'appel à une API tierce.
