# Schéma de base de données — Supabase

## Tables

### `profiles`
Profils utilisateurs (Be🐒 / Princesse chat🚀).

### `decks`
Decks de flashcards.
- `id`, `name`, `description`, `theme_id` (lié à la constante `THEMES`), `created_at`

### `cards`
Cartes individuelles.
- `id`, `deck_id`, `front` (nullable), `back` (nullable), `image_path`

### `deck_criteria`
Colonnes/critères d'un deck (modèle multi-critères).
- `id`, `deck_id`, `name`, `type`, `question_title`, `position`
- `interrogeable boolean default true` — si false, jamais posé en question
- `quiz_answer_criterion_id uuid` — référence self (critère-réponse pour le QCM)
- **RLS désactivé**

### `card_values`
Valeurs par carte × critère.
- `id`, `card_id`, `criterion_id`, `value`
- Contrainte unique `(card_id, criterion_id)`
- **RLS désactivé**

### `card_progress`
Progression répétition espacée par profil × carte × critère.
- `id`, `profile_id`, `card_id`, `criterion_id`, `level` (0–4), `next_review`, `last_reviewed`
- **RLS activé** — filtré par `profile_id`

### `quiz_questions`
Questions QCM libres.
- `id`, `profile_id`, `question`, `answer`, `wrong_answers text[]`, `theme`
- **RLS désactivé**

### `bisou_messages`
- `id`, `profile_id`, `emoji`, `message` (max 140 chars), `created_at`

### `programme_events`
- `id`, `title`, `emoji` (default '📅'), `event_date`, `event_end_date` (nullable), `event_time`, `note`, `is_annual boolean`, `created_by`, `created_at`

> Migration : `ALTER TABLE programme_events ADD COLUMN event_end_date date;`

### `orbite_activities`
- `id`, `profile_id`, `type` (`walk`|`run`|`workout`), `value`, `unit`, `props` (points convertis), `created_at`

### `orbite_settings`
- `profile_id` (PK), `daily_goal` (déf. 1000), `weekly_rocket_target` (déf. 10000)
- `rate_walk`, `rate_run_km`, `rate_run_min`, `rate_workout_min`, `rate_workout_sessions`

### `grimoire_recipes`
- `id`, `name`, `ingredients` (jsonb), `instructions`, `source` (`manual`|`spoonacular`)

### `grimoire_meal_plan`
- `id`, `date`, `recipe_id`, `meal_type` (`breakfast`|`lunch`|`dinner`)

### `grimoire_settings`
- `profile_id` (PK), `pantry` (jsonb)

## Règles importantes

- **Seule `card_progress` a RLS actif.** Les autres tables sont partagées entre profils.
- La sélection de profil est stockée en `localStorage` (`flashcard-profile`), pas via Supabase Auth.
- La clé anon Supabase est sûre à exposer côté client (RLS protège les données sensibles).

## Tables prévues (apps en préparation)

```sql
-- Canon (cave à vin)
canon_bottles (id, name, appellation, vintage, quantity, rating, notes, created_at)
canon_tastings (id, bottle_id, profile_id, date, nose, palate, finish, score, created_at)
```
