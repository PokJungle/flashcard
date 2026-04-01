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
{ nom:'Marie',              icon:'❤️‍🔥' }  // 15 août
{ nom:'Benoît',             icon:'🐵' }   // 11 juillet
{ nom:'Patrick',            icon:'🍀' }   // 17 mars
{ nom:'Joseph',             icon:'🍷' }   // 19 mars
{ nom:'Valentin',           icon:'💝' }   // 14 février
{ nom:'Noël',               icon:'🎄' }   // 25 décembre
{ nom:'Toussaint',          icon:'🕯️' }   // 1er novembre
{ nom:'Nicolas',            icon:'🎅' }   // 6 décembre
{ nom:'Lucie',              icon:'🔆' }   // 13 décembre
{ nom:'Hervé',              icon:'😡' }   // 17 juin
{ nom:"Jour de l'an",       icon:'🥂' }   // 1er janvier
{ nom:'Fête de la musique', icon:'🎵' }   // 21 juin
{ nom:'Fête Nationale',     icon:'🎆' }   // 14 juillet
{ nom:'Fête du Travail',    icon:'💮' }   // 1er mai
{ nom:'Victoire 45',        icon:'🕊️' }   // 8 mai
{ nom:'Armistice',          icon:'🕊️' }   // 11 novembre
{ nom:'Pâques',             icon:'🥚' }   // mobile — 2026=5/4, 2027=28/3 ⚠️ à maj chaque année
```

## Widgets

### MeteoWidget (`src/components/widgets/MeteoWidget.jsx`)

- Taille fixe 170px de largeur
- Fond `#4f3ea0`, cercle déco `w-40 h-40 -top-14 -right-14`
- Icône WMO 48px, temp moy 34px, min/max colorés, pluie+vent
- Conseil parapluie/claquettes (seuil vent 40 km/h)
- `<span>` pour "Changer ›" (pas `<button>` — évite imbrication invalide)
- Ville par profil : `localStorage bbp-meteo-city-{profileId}` → fallback `meteo-fav2` → `DEFAULT_METEO_CITY`

### BisouWidget (`src/components/widgets/BisouWidget.jsx`)

- Dernier message de l'AUTRE profil
- Emoji seul → 38px centré ; avec texte → emoji 22px + nom expéditeur + 3 lignes max
- Pastille 💗 si message non lu (`hasBadge` prop depuis App.jsx)

### CoursesWidget (`src/components/widgets/CoursesWidget.jsx`)

- Fond post-it adaptatif : `#fef9c3` (clair) / `#1a1035` (sombre)
- Hauteur 48px, clic → `openApp('recettes', { initialShoppingList: true })`
- Point orange/bleu selon mode si des items sont dans le meal_plan de la semaine courante
- **Mode dark** : utilise les couleurs du thème (violet/bleu)

### AgendaWidget (`src/components/widgets/AgendaWidget.jsx`)

- Affiche jusqu'à 4 prochains événements de `programme_events`
- Gère `is_annual`, `event_end_date`, âge anniversaires (`getAge()`)
- Compte à rebours amber si ≤ 3 jours
- Badge amber sur la tuile hub (`programmeBadge` dans App.jsx)

### OrbiteWidget (`src/components/widgets/OrbiteWidget.jsx`)

- Largeur 64px, toute la hauteur de la colonne droite
- Jauge verticale bicolore : orange🐒 / bleu🚀
- Affiché uniquement si des données existent pour la semaine en cours

### MemoireWidget (`src/components/widgets/MemoireWidget.jsx`)

- Compact, dans la rangée basse avec CoursesWidget
- Affiche les cartes dues aujourd'hui

### TraineWidget (`src/components/widgets/TraineWidget.jsx`)

- Widget pour l'app Ça Traîne (todo partagée)
- **Tri intelligent** : Tâches avec 2 flammes 🔥🔥 d'abord, puis 1 flamme 🔥, puis 0 flamme
- **Limitation à 3 tâches** maximum avec complétion par les plus anciennes si nécessaire
- **Fonds colorés selon priorité** :
  - 🔥🔥 (2 flammes) : `#fef5e6` (orange avec touche de rouge)
  - 🔥 (1 flamme) : `#fffbf4` (orange très doux)
  - (0 flamme) : `#fff` (blanc standard)
- **Mise en page optimisée** : Texte calé à gauche, flammes alignées à droite
- **Affichage des flammes** : 🔥🔥 pour 2 flammes, 🔥 pour 1 flamme, vide pour 0 flamme
- **Tri par date** : Plus anciennes en premier en cas d'égalité de flammes

## CityPicker (modal)

- Favoris sauvegardés sous `meteo-fav2`
- Ville choisie sauvegardée sous `bbp-meteo-city-{profileId}`

## Gestion des badges dans App.jsx

```js
// Bisou : message non lu de l'autre profil
const [bisouBadge, setBisouBadge] = useState(false);

// Programme : événement dans ≤ 3 jours
const [programmeBadge, setProgrammeBadge] = useState(false);
```

Les deux sont vérifiés au montage via des requêtes Supabase dans `useEffect`.

## Bonnes pratiques React implémentées

### useEffect asynchrones

- **MeteoWidget** : `loadWeather()` dans wrapper async pour éviter les setState synchrones
- **useProgramme** : `fetchEvents()` dans wrapper async pour les mêmes raisons
- **Traine** : Déclaration des fonctions avant leur utilisation dans les effets

### Architecture modulaire

- **Séparation des utilitaires** : `meteo.utils.js` pour la logique météo
- **Fast Refresh** : Les widgets n'exportent que des composants React
- **Mode dark unifié** : Tous les widgets s'adaptent au thème

### Performance

- **useCallback** : Fonctions stables dans les dépendances d'effets
- **Déclarations ordonnées** : Variables/fonctions déclarées avant utilisation
