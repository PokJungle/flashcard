# 💥 Mise en Orbite — Documentation

## Architecture

```
src/apps/Orbite/
├── index.jsx              # Nav dark custom (pas de TabBar partagé)
├── hooks/useOrbite.js
└── screens/
    ├── DashboardScreen.jsx
    ├── LogScreen.jsx
    ├── HistoryScreen.jsx
    └── SettingsScreen.jsx
```

## Navigation

Orbite utilise une **nav custom dark** intentionnelle (thème spatial) — pas de `<TabBar>` partagé.
4 onglets : Mission / Logger / Historique / Réglages.

## Système de Props 🚀

Les activités sont converties en **Props** (points) via des taux configurables par profil (`orbite_settings`) :

| Type | Unité | Taux |
|------|-------|------|
| `walk` | pas | `rate_walk` (par pas) |
| `run` | km | `rate_run_km` |
| `run` | min | `rate_run_min` |
| `workout` | min | `rate_workout_min` |
| `workout` | séances | `rate_workout_sessions` |

## Mécaniques

- **Streak 🔥** : jours consécutifs où l'objectif journalier (`daily_goal`) est atteint
- **Mission décollage 💥** : barre fusée commune aux deux profils, objectif `weekly_rocket_target`
- **Compétition hebdo** : Be🐒 vs Princesse🚀 avec badge vainqueur dans l'historique
- **OrbiteWidget** (hub) : jauge verticale bicolore orange🐒/bleu🚀, visible si données semaine en cours

## Tables Supabase

- **`orbite_activities`** — `id`, `profile_id`, `type` (`walk`\|`run`\|`workout`), `value`, `unit`, `props` (points convertis), `created_at`
- **`orbite_settings`** — `profile_id` (PK), `daily_goal` (déf. 1000), `weekly_rocket_target` (déf. 10000), `rate_walk`, `rate_run_km`, `rate_run_min`, `rate_workout_min`, `rate_workout_sessions`
