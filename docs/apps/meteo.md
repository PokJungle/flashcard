# 🌦️ Parapluie ou Claquettes — Documentation

## Architecture

```
src/apps/Meteo/
└── index.jsx   # Écran unique, pas de TabBar
```

## Modèles météo agrégés (Open-Meteo, sans auth)

| Modèle | Code |
|--------|------|
| AROME (Météo France) | `arome` |
| ICON-D2 (DWD) | `icon_d2` |
| ICON-EU (DWD) | `icon_eu` |
| Météo France | `meteofrance` |
| ECMWF | `ecmwf` |
| GFS (NOAA) | `gfs` |

Les 6 modèles sont interrogés et leurs prévisions agrégées pour afficher une synthèse.

## MeteoWidget (hub)

- Fond `#4f3ea0`, icône WMO, temp moyenne 34px, min/max, pluie + vent
- Conseil **parapluie** ou **claquettes** selon seuils :
  - Pluie prévue → parapluie ☂️
  - Vent > 40 km/h → claquettes 🌬️
- Ville par profil : `localStorage bbp-meteo-city-{profileId}`
- Changement de ville via le city picker dans le hub

## Clé localStorage

```
bbp-meteo-city-{profileId}   # Nom de la ville météo du profil
```
