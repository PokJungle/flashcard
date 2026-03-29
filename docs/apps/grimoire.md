# 📖 Le Grimoire Gourmand — Documentation

## Architecture

```
src/apps/Grimoire/
└── index.jsx   # Tout en un fichier + TabBar (orange #f97316) en bas
```

## Onglets

- **Inspiration 💡** — recherche Spoonacular + recettes manuelles
- **Grimoire 📖** — bibliothèque des recettes sauvegardées
- **Semaine 📅** — planning repas + liste de courses

## Ouverture directe depuis le hub

Prop `initialShoppingList: true` → ouvre directement l'onglet Semaine avec la modal courses :
```js
openApp('recettes', { initialShoppingList: true })
```
Utilisé par le CoursesWidget (fond post-it `#fef9c3`) du hub.

## Cache sessionStorage

Clé `grimoire_cache_*` avec TTL 1h pour les traductions EN→FR (API MyMemory).
Évite de re-traduire les recettes Spoonacular à chaque ouverture.

## Liste de courses

- Générée depuis les recettes du meal_plan de la semaine
- Déduplique contre le placard (`grimoire_settings.pantry`) pour ne lister que ce qui manque

## Améliorations prévues

- Traduction encore perfectible — certaines recettes Spoonacular restent en anglais

## APIs utilisées

| API | Auth | Usage |
|-----|------|-------|
| Spoonacular | `VITE_SPOONACULAR_KEY` | Recherche recettes + nutrition |
| MyMemory | Aucune | Traduction EN→FR des recettes |

## Tables Supabase

- **`grimoire_recipes`** — `id`, `name`, `ingredients` (jsonb), `instructions`, `source` (`manual`\|`spoonacular`)
- **`grimoire_meal_plan`** — `id`, `date`, `recipe_id`, `meal_type` (`breakfast`\|`lunch`\|`dinner`)
- **`grimoire_settings`** — `profile_id` (PK), `pantry` (jsonb)
