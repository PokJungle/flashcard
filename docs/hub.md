# Hub (App.jsx) — Documentation détaillée

## Layout

```
DayHeader (centré, max-w-lg)
─────────────────────────────────────────────
[ Météo 170px ] [ Bisou flex-1          ] | Orbite 64px
[ 🛒 48px     ] [ Agenda flex-1         ] | (toute hauteur)
─────────────────────────────────────────────
Grille apps 3 colonnes (sans Bisou)
En préparation (grid 2 cols)
```

## DayHeader

- Greeting selon l'heure : Bonjour / Bonne après-midi / Bonsoir / Bonne nuit + avatar profil
- Date complète en français, centré, `max-w-lg mx-auto px-3`
- Fête du jour : calendrier statique 366 jours intégré dans `src/data/saints.js` (pas d'API)
- **Fêtes normales** : texte 10px discret `#c4b5fd`, sans emoji
- **Fêtes spéciales** : bannière fond doré `linear-gradient(135deg,#b45309,#d97706,#f59e0b)`, texte blanc 15px, 36 confettis CSS animés

### Fêtes spéciales (`FETES_SPECIALES` dans App.jsx)

```js
{ nom:'Marie', icon:'❤️‍🔥' }        // 15 août
{ nom:'Benoît', icon:'🐵' }          // 11 juillet
{ nom:'Patrick', icon:'🍀' }         // 17 mars
{ nom:'Valentin', icon:'💝' }        // 14 février
{ nom:'Noël', icon:'🎄' }            // 25 décembre
{ nom:"Jour de l'an", icon:'🥂' }   // 1er janvier
{ nom:'Fête Nationale', icon:'🎆' } // 14 juillet
{ nom:'Pâques', icon:'🥚' }         // mobile — ⚠️ à mettre à jour chaque année
```

## Widgets

### MeteoWidget (`src/components/widgets/MeteoWidget.jsx`)
- Taille fixe 170px de largeur
- Fond `#4f3ea0`, icône WMO, temp moy 34px, min/max, pluie+vent
- Conseil parapluie/claquettes (seuil vent 40 km/h)
- Ville par profil via `localStorage bbp-meteo-city-{profileId}`

### BisouWidget (`src/components/widgets/BisouWidget.jsx`)
- Dernier message de l'AUTRE profil
- Emoji seul → 38px centré ; avec texte → emoji 22px + expéditeur + 3 lignes
- Pastille 💗 si message non lu (`hasBadge` prop depuis App.jsx)

### CoursesWidget (`src/components/widgets/CoursesWidget.jsx`)
- Fond post-it `#fef9c3`, hauteur 48px
- Clic → `openApp('recettes', { initialShoppingList: true })`
- Point orange si des items sont dans le meal_plan de la semaine courante

### AgendaWidget (`src/components/widgets/AgendaWidget.jsx`)
- Affiche jusqu'à 4 prochains événements de `programme_events`
- Gère `is_annual`, `event_end_date`, âge anniversaires (`getAge()`)
- Compte à rebours amber si ≤ 3 jours
- Badge amber sur la tuile hub (point `programmeBadge` dans App.jsx)

### OrbiteWidget (`src/components/widgets/OrbiteWidget.jsx`)
- Largeur 64px, toute la hauteur de la colonne droite
- Jauge verticale bicolore : orange🐒 / bleu🚀
- Affiché uniquement si des données existent pour la semaine en cours

### MemoireWidget (`src/components/widgets/MemoireWidget.jsx`)
- Compact, dans la rangée basse avec CoursesWidget
- Affiche les cartes dues aujourd'hui

### TraineWidget (`src/components/widgets/TraineWidget.jsx`)
- Widget pour l'app Ça Traîne (todo partagée)

## Gestion des badges dans App.jsx

```js
// Bisou : message non lu de l'autre profil
const [bisouBadge, setBisouBadge] = useState(false)

// Programme : événement dans ≤ 3 jours
const [programmeBadge, setProgrammeBadge] = useState(false)
```

Les deux sont vérifiés au montage via des requêtes Supabase dans `useEffect`.
