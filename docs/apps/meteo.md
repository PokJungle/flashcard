# 🌦️ Parapluie ou Claquettes — Documentation

## Architecture

```
src/apps/Meteo/
└── index.jsx   # Écran unique, pas de TabBar
```

## Fonctionnalités

- Météo agrégée sur **6 modèles** (voir ci-dessous)
- Vue 7 jours
- Vue heure par heure
- Favoris multi-villes
- Filtre des heures passées sur le jour courant

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

- Fond `#4f3ea0`, cercle déco `w-40 h-40 -top-14 -right-14`
- Icône WMO 48px, température moyenne 34px, min/max colorés, pluie + vent
- Conseil **parapluie** ou **claquettes** selon seuils :
  - Pluie prévue → parapluie ☂️
  - Vent > 40 km/h → claquettes 🌬️
- `<span>` pour "Changer ›" (pas `<button>` — évite imbrication invalide dans le bouton widget)
- Ville par profil : `localStorage bbp-meteo-city-{profileId}` → fallback `meteo-fav2` → `DEFAULT_METEO_CITY`

## CityPicker (modal dans le hub)

- Favoris sauvegardés sous clé `meteo-fav2`
- Sauvegarde ville choisie sous `bbp-meteo-city-{profileId}`

## Clés localStorage

```
bbp-meteo-city-{profileId}   # Nom de la ville météo du profil
meteo-fav2                   # Ville favorite globale (fallback)
```
