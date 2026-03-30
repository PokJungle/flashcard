# 🌦️ Parapluie ou Claquettes — Documentation

## Architecture

```
src/apps/Meteo/
├── index.jsx          # Écran unique, pas de TabBar
└── meteo.utils.js     # Utilitaires météo
```

## Fonctionnalités

- Météo agrégée sur **6 modèles** (voir ci-dessous)
- Vue 7 jours
- Vue heure par heure
- Favoris multi-villes
- Filtre des heures passées sur le jour courant

## Fichier utilitaire (`meteo.utils.js`)

```javascript
export const DEFAULT_METEO_CITY        # Ville par défaut
export function getPreferredCity()     # Récupération ville du profil
export const WMO_ICONS               # Icônes météo WMO
export function getConseil()          # Logique parapluie/claquettes
export async function fetchWeatherForCity() # Appel API simple (best_match)
export async function fetchCurrentHourWeather() # Appel API multi-modèles heure actuelle
```

## Modèles météo agrégés (Open-Meteo, sans auth)

| Modèle               | Code                   |
| -------------------- | ---------------------- |
| AROME (Météo France) | `arome_france`         |
| ICON-D2 (DWD)        | `icon_d2`              |
| ICON-EU (DWD)        | `icon_eu`              |
| Météo France         | `meteofrance_seamless` |
| ECMWF                | `best_match`           |
| GFS (NOAA)           | `gfs_seamless`         |

Les 6 modèles sont interrogés et leurs prévisions agrégées pour afficher une synthèse.

## Widget météo (header)

### 📍 **Où il se trouve**

Le widget météo est dans le composant `DayHeader` dans `src/App.jsx` (lignes 221-249).

### ⚡ **Comment il fonctionne**

- **Fonction utilisée** : `fetchCurrentHourWeather()`
- **Données** : Moyenne des 6 modèles pour l'heure actuelle + daily min/max
- **Rafraîchissement** : Au chargement du profil et changement de ville

### 🌡️ **Calculs affichés**

- **Température principale** : Moyenne des modèles pour l'heure actuelle
- **Température min/max** : Moyenne des modèles pour **la journée complète**
- **Icône** : Code WMO médian des modèles
- **Pluie** : Moyenne des précipitations (mm, 1 décimale)
- **Vent** : Moyenne des vitesses de vent (km/h, arrondi)

### 🔄 **Différences avec l'app complète**

- **Widget** : Heure actuelle + min/max journée, moyenne des modèles
- **App complète** : Vue 7 jours + heure par heure, choix du modèle

## MeteoWidget (non utilisé)

> ⚠️ **Attention** : Le composant `MeteoWidget.jsx` existe mais n'est PAS utilisé dans l'application. Le widget météo est implémenté directement dans `DayHeader` (`App.jsx`).

## CityPicker (modal dans le hub)

- Favoris sauvegardés sous clé `meteo-fav2`
- Sauvegarde ville choisie sous `bbp-meteo-city-{profileId}`

## Clés localStorage

```
bbp-meteo-city-{profileId}   # Nom de la ville météo du profil
meteo-fav2                   # Ville favorite globale (fallback)
```

## 🐛 **Debug rapide**

Si les données météo semblent incohérentes :

1. **Vérifier la console** : Les erreurs API s'affichent là
2. **Comparer avec l'app** : Ouvrir l'app météo complète et comparer l'heure actuelle
3. **Vérifier la ville** : `localStorage.getItem('bbp-meteo-city-{profileId}')`
4. **API directe** : Tester l'URL Open-Meteo dans le navigateur

## 📝 **Historique des modifications**

- **v2.1** : Widget utilise min/max de la journée + température actuelle de l'heure
- **v2** : Widget utilise `fetchCurrentHourWeather()` avec moyenne des modèles pour l'heure actuelle
- **v1** : Widget utilisait `fetchWeatherForCity()` avec `best_match` seul (daily)
