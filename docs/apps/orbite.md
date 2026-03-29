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

- **Face-à-face** : barres de progression hebdo Be🐒 vs Princesse🚀, message d'encouragement pour le profil en retard
- **Saisie manuelle** avec aperçu Props en temps réel
- **Streak 🔥** : jours consécutifs où l'objectif journalier (`daily_goal`) est atteint
- **Mission décollage 💥** : barre de progression fusée commune aux deux profils, objectif `weekly_rocket_target`
- **Historique** : 8 dernières semaines, vainqueur 🏆 + badge DÉCOLLAGE si objectif atteint
- **OrbiteWidget** (hub) : jauge verticale bicolore orange🐒/bleu🚀, visible si données semaine en cours

## Améliorations prévues

- Suppression d'une activité depuis le dashboard
- Ajouter une activité sur une semaine passée

## Tables Supabase

```sql
create table orbite_activities (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id),
  type text not null,          -- 'walk' | 'run' | 'workout'
  value numeric not null,
  unit text not null,
  props integer not null,      -- points convertis
  created_at timestamp with time zone default now()
);

create table orbite_settings (
  profile_id uuid references profiles(id) primary key,
  daily_goal integer default 1000,
  weekly_rocket_target integer default 10000,
  rate_walk numeric default 1,
  rate_run_km numeric default 1750,
  rate_run_min numeric default 250,
  rate_workout_min numeric default 150,
  rate_workout_sessions numeric default 500
);
```
