# APIs externes

## Open-Meteo (Météo)

- **Auth** : aucune (API gratuite)
- **Usage** : prévisions météo, 6 modèles agrégés
- **URL** : `https://api.open-meteo.com/v1/forecast`
- **Modèles** : AROME, ICON-D2, ICON-EU, Météo France, ECMWF, GFS

## Spoonacular (Grimoire)

- **Auth** : `VITE_SPOONACULAR_KEY` (variable d'environnement)
- **Usage** : recherche de recettes, informations nutritionnelles
- **Limite** : quota journalier sur le plan gratuit

## MyMemory (Grimoire)

- **Auth** : aucune (API gratuite, limite ~5000 mots/jour)
- **Usage** : traduction EN→FR des recettes Spoonacular
- **Cache** : sessionStorage `grimoire_cache_*` TTL 1h pour éviter la re-traduction

## Wikipedia (Flashcards)

- **Auth** : aucune
- **Usage** : images illustrant les cartes de flashcards
- **Proxy** : `/api/proxy.js` (Vercel serverless) pour contourner les restrictions CORS
- Les images sont récupérées côté serveur et renvoyées au client

## Supabase (base de données)

- **Auth** : clé anon `VITE_SUPABASE_ANON_KEY` (sûre à exposer — RLS protège les données)
- **Usage** : toutes les données persistantes (voir `docs/database.md`)
- **Client** : instance unique dans `src/supabase.js`, importée partout
