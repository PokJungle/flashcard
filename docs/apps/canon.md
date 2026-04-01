---
description: Application de gestion de cave à vin
---

# 🍷 Canon — Documentation

## Architecture

```
src/apps/Canon/
├── index.jsx              # routing + TabBar rouge (#9b1c1c)
├── hooks/
│   └── useCanon.js        # CRUD bouteilles + dégustations + zones
└── screens/
    ├── CaveScreen.jsx     # Liste bouteilles + filtres + actions
    └── JournalScreen.jsx  # Historique dégustations + palmarès
```

## Fonctionnalités

- **Cave** 🏚️ : Ajout/modif/suppression bouteilles, filtres (couleur/zone/région), transferts entre zones
- **Journal** 📓 : Dégustations chronologiques, notes ⭐, coup de cœur ❤️, réactions partagées
- **Modes de consommation** : "Bu + noter" (stock + journal) ou "Bu sans noter" (stock uniquement)
- **Gestion des zones** : Zones personnalisables, roue cranté ⚙️ pour config
- **Badges d'état** : "Dernière !" (qty=1), "Terminé !" (qty=0)
- **Multi-profils** : Cave commune, dégustations individuelles

## Gestion des stocks

### Système de localisation

- **Nouveau format** : `locations: [{ zone: string, qty: number }]` (multi-zones)
- **Rétrocompat** : Support des anciens champs `zone` et `quantity`
- **Fonctions utilitaires** : `getLocations()`, `getTotalQty()`, `computeLocations()`

### Opérations de stock

- `addToZone(id, zone, qty)` : Ajout de bouteilles dans une zone
- `transferZone(id, from, to, qty)` : Transfert entre zones
- `removeFromZone(bottle, zone, qty)` : Décrémentation (mode "sans noter")
- `drinkBottle(bottle, zone, tastingData)` : Décrémentation + dégustation

## Tables Supabase

```sql
create table canon_bottles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text,
  appellation text,
  vintage integer,
  color text check (color in ('rouge', 'blanc', 'rosé', 'effervescent')),
  region text,
  grape text,
  locations jsonb default '[]',
  quantity integer default 0,
  zone text,                    -- rétrocompat
  purchase_note text,
  created_at timestamp with time zone default now()
);

create table canon_tastings (
  id uuid default gen_random_uuid() primary key,
  bottle_id uuid references canon_bottles(id) on delete set null,
  profile_id uuid references profiles(id),
  name text not null,
  domain text,
  appellation text,
  vintage integer,
  color text,
  region text,
  grape text,
  rating numeric(2,1) check (rating between 0 and 5),
  is_favorite boolean default false,
  note text,
  tasted_at date default current_date,
  reactions jsonb default '[]',
  created_at timestamp with time zone default now()
);
```

## Hook principal : `useCanon`

```javascript
export function useCanon(profile) {
  // États
  const [bottles, setBottles] = useState([]);
  const [tastings, setTastings] = useState([]);
  const [loading, setLoading] = useState(true);

  // CRUD bouteilles
  const addBottle = async (data) => {
    /* ... */
  };
  const updateBottle = async (id, data) => {
    /* ... */
  };
  const deleteBottle = async (id) => {
    /* ... */
  };

  // CRUD dégustations
  const addTasting = async (data) => {
    /* ... */
  };
  const deleteTasting = async (id) => {
    /* ... */
  };
  const addReaction = async (tastingId, reaction) => {
    /* ... */
  };

  // Opérations de stock
  const drinkBottle = async (bottle, zone, tastingData) => {
    /* ... */
  };
  const addToZone = async (id, zone, qty = 1) => {
    /* ... */
  };
  const transferZone = async (id, from, to, qty) => {
    /* ... */
  };
  const removeFromZone = async (bottle, zone, qty = 1) => {
    /* ... */
  };

  // Utilitaires
  const loadAll = async () => {
    /* ... */
  };
  const refreshBottles = async () => {
    /* ... */
  };

  return { bottles, tastings, profiles, loading /* ... */ };
}
```

## Optimisations

### Performance

- **Chargement parallèle** : `Promise.all` pour bottles/tastings/profiles
- **Rechargements ciblés** : `refreshBottles()` au lieu de `loadAll()`
- **Gestion d'erreurs** : Try/catch + validation des données
- **Synchronisation** : Double mise à jour (BDD + state local)

### Cas d'usage spécifiques

- **Dernière bouteille** : Badge "Dernière !" + bordure orange
- **Bouteille terminée** : Badge "Terminé !" + opacité réduite + bordure rouge
- **Filtre ∅** : Affiche/cache les bouteilles avec qty=0
- **Multi-zones** : Gestion des stocks par emplacement

## Évolutions prévues

- Import/Export CSV/JSON
- Statistiques avancées (graphiques consommation)
- Scanner codes-barres pour identification
- Notifications rappels consommation optimale
- Photos étiquettes + IA reconnaissance
