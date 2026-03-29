# 💌 Bisou — Documentation

## Architecture

```
src/apps/Bisou/
└── index.jsx   # Écran unique, pas de TabBar
```

## Fonctionnement

- Messagerie emoji entre Be🐒 et Princesse chat🚀
- Messages limités à **140 caractères**
- Chaque message a un emoji principal + texte optionnel

## Badge hub

- Pastille 💗 animée sur la tuile hub si l'autre profil a envoyé un message non lu
- Lu = timestamp stocké dans `localStorage bisou-last-seen-{profileId}`
- Vérifié au chargement du hub dans `App.jsx`

## BisouWidget (hub)

- Affiche le dernier message de l'**autre** profil
- Emoji seul → 38px centré
- Avec texte → emoji 22px + nom expéditeur + 3 lignes max

## Table Supabase

- **`bisou_messages`** — `id`, `profile_id`, `emoji`, `message` (max 140 chars), `created_at`

## Clé localStorage

```
bisou-last-seen-{profileId}   # ISO timestamp du dernier message lu
```
