# 🗞️ Demandez le Programme — Documentation

## Architecture

```
src/apps/Programme/
├── index.jsx              # routing + TabBar indigo (#6366f1)
├── hooks/useProgramme.js  # getNextOccurrence, daysUntil, isOngoing, isPast, getAge
└── screens/
    ├── HomeScreen.jsx     # ListView + MonthView (prop view)
    └── AddEventModal.jsx  # Ajout + édition d'événement
```

## Fonctionnalités

- **Vue Liste** 📋 : sections "🟢 En cours" / "🔥 Très bientôt" (≤3j) / "À venir"
- **Vue Mois** 🗓️ : calendrier, navigation mois, pastilles sur tous les jours d'un span, détail au clic
- **Ajout** : emoji + titre + début + fin optionnelle + heure + note + récurrence annuelle
- **Édition** : bouton crayon sur chaque carte, modal pré-remplie
- **Suppression**
- **Widget hub** : prochain événement + compte à rebours, badge amber si ≤ 3 jours

## Événements sur plusieurs jours

Champ `event_end_date date` (nullable). Si renseigné :
- Affichage "du X au Y mars 2026" dans les cartes
- Calendrier : pastilles sur tous les jours du span
- Badge "En cours 🟢" si `event_date <= today <= event_end_date`
- Non compatible avec `is_annual` (champ masqué dans le formulaire)

## Récurrence annuelle

- `is_annual: true` → `getNextOccurrence()` recalcule chaque année
- `event_date` avec une année réelle (ex: `1990-07-11`) → affiche l'âge "X ans"
- Âge calculé par `getAge()` dans `useProgramme.js`, utilisé dans les cartes et l'AgendaWidget

## Table Supabase

```sql
create table programme_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  emoji text not null default '📅',
  event_date date not null,
  event_end_date date,           -- nullable, événements multi-jours
  event_time time,               -- nullable
  note text,                     -- nullable
  is_annual boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);
```

> ⚠️ Migration à appliquer si pas encore fait : `ALTER TABLE programme_events ADD COLUMN event_end_date date;`

## Fonctions utilitaires exportées (`useProgramme.js`)

| Fonction | Rôle |
|----------|------|
| `getNextOccurrence(event)` | Prochaine occurrence (gère annuel) → Date JS |
| `daysUntil(event)` | Jours jusqu'à la prochaine occurrence |
| `isOngoing(event)` | `true` si aujourd'hui est dans `[event_date, event_end_date]` |
| `isPast(event)` | `true` si l'événement est terminé (non annuel) |
| `getAge(event)` | Âge en années pour les annuels avec année de naissance |
