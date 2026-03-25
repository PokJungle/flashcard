# 🏠 Mes Apps — Specs & État

> Plateforme personnelle React + Vite + Supabase  
> Déployée sur Vercel : [flashcard-ten-virid.vercel.app](https://flashcard-ten-virid.vercel.app)  
> Repo : [PokJungle/flashcard](https://github.com/PokJungle/flashcard)  
> Profils : Be🐒 / Princesse chat🚀

---

## 🗂️ Fichiers du projet

| Fichier | URL raw |
|---------|---------|
| `src/App.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/App.jsx |
| `src/supabase.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/supabase.js |
| `src/apps/Flashcards/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/index.jsx |
| `src/apps/Flashcards/constants.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/constants.js |
| `src/apps/Flashcards/utils.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/utils.js |
| `src/apps/Flashcards/hooks/useMemoire.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/hooks/useMemoire.js |
| `src/apps/Flashcards/hooks/useStudySession.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/hooks/useStudySession.js |
| `src/apps/Flashcards/hooks/useQuiz.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/hooks/useQuiz.js |
| `src/apps/Flashcards/screens/HomeMemoire.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/HomeMemoire.jsx |
| `src/apps/Flashcards/screens/StudyScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/StudyScreen.jsx |
| `src/apps/Flashcards/screens/SessionEnd.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/SessionEnd.jsx |
| `src/apps/Flashcards/screens/ManageDeck.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/ManageDeck.jsx |
| `src/apps/Flashcards/screens/HomeQuiz.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/HomeQuiz.jsx |
| `src/apps/Flashcards/screens/QuizScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/QuizScreen.jsx |
| `src/apps/Flashcards/screens/QuizEnd.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/QuizEnd.jsx |
| `src/apps/Flashcards/screens/ManageQuestions.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/ManageQuestions.jsx |
| `src/apps/Meteo/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Meteo/index.jsx |
| `src/apps/Grimoire/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Grimoire/index.jsx |
| `src/apps/Bisou/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Bisou/index.jsx |
| `src/apps/Programme/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/index.jsx |
| `src/apps/Programme/hooks/useProgramme.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/hooks/useProgramme.js |
| `src/apps/Programme/screens/HomeScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/screens/HomeScreen.jsx |
| `src/apps/Programme/screens/AddEventModal.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/screens/AddEventModal.jsx |
| `src/apps/Orbite/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Orbite/index.jsx |
| `src/apps/Orbite/hooks/useOrbite.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Orbite/hooks/useOrbite.js |
| `src/apps/Orbite/screens/DashboardScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Orbite/screens/DashboardScreen.jsx |
| `src/apps/Orbite/screens/LogScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Orbite/screens/LogScreen.jsx |
| `src/apps/Orbite/screens/HistoryScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Orbite/screens/HistoryScreen.jsx |
| `src/apps/Orbite/screens/SettingsScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Orbite/screens/SettingsScreen.jsx |

---

## 🏠 Hub BBP — App.jsx

### Layout

```
DayHeader (centré, max-w-lg)
─────────────────────────────────────────────
[ Météo 170px ] [ Bisou flex-1          ] | Orbite 64px
[ 🛒 48px     ] [ Agenda flex-1         ] | (toute hauteur)
─────────────────────────────────────────────
Grille apps 4 colonnes (sans Bisou)
En préparation (grid 2 cols)
```

### DayHeader
- Greeting selon l'heure (Bonjour / Bonne après-midi / Bonsoir / Bonne nuit) + avatar profil
- Date complète en français, centré, `max-w-lg mx-auto px-3`
- Fête du jour : calendrier statique 366 jours intégré (pas d'API externe)
- **Fêtes normales** : texte 10px discret `#c4b5fd`, sans emoji
- **Fêtes spéciales** : bannière fond doré `linear-gradient(135deg,#b45309,#d97706,#f59e0b)`, texte blanc 15px, 36 confettis animés CSS, pas de sous-titre

**Fêtes spéciales** (dans `FETES_SPECIALES`, facile à étendre) :
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

### MeteoWidget (170px)
- Fond `#4f3ea0`, cercle déco `w-40 h-40 -top-14 -right-14`
- Icône WMO 48px, température moyenne 34px, min/max colorés, pluie + vent
- Conseil parapluie/claquettes : icône 22px + texte (seuil vent 40 km/h)
- `<span>` pour "Changer ›" (pas `<button>` — évite imbrication invalide)
- Ville par profil : `localStorage bbp-meteo-city-{profileId}` → fallback `meteo-fav2` → `DEFAULT_METEO_CITY`

**Messages conseil** (tous sur thème parapluie/claquettes, voir code pour liste complète)

### BisouWidget
- Dernier message de l'AUTRE profil
- Emoji seul → emoji 38px centré ; avec texte → emoji 22px + from + 3 lignes
- Pastille 💗 si message non lu

### CoursesWidget (48px, alignSelf stretch)
- Fond post-it `#fef9c3`, point orange si items dans meal_plan semaine
- Clic → `openApp('recettes', { initialShoppingList: true })`

### AgendaWidget
- Prochain événement `programme_events`, gère `is_annual`
- Compte à rebours urgent (≤3j) en amber

### OrbiteWidget (64px, toute hauteur)
- Fond dark, jauge verticale bicolore orange/bleu
- Affiché uniquement si données semaine en cours

### CityPicker (modal)
- Favoris `meteo-fav2` + sauvegarde `bbp-meteo-city-{profileId}`

---

## ✅ Apps existantes

### 🐒 Mémoire de Singe
> Révision par répétition espacée multi-critères

**Architecture (v2 — refonte mars 2026)**
```
src/apps/Flashcards/
  index.jsx          ← routing + bottom nav + import JSON + création deck
  constants.js       ← THEMES, TABS, SCREENS, QUIZ_SOURCES_KEY
  utils.js           ← compressImage
  hooks/
    useMemoire.js    ← chargement decks + dues + progression par critère
    useStudySession.js ← algo répétition espacée par critère
    useQuiz.js       ← session QCM Duo/Carré/Cash
  screens/
    HomeMemoire.jsx  ← accueil + filtre par profil + créer deck
    StudyScreen.jsx  ← révision multi-critères, révélation en place
    SessionEnd.jsx   ← fin session stats
    ManageDeck.jsx   ← gestion deck + critères + cartes
    HomeQuiz.jsx     ← accueil Quiz + sources + jauge modes
    QuizScreen.jsx   ← QCM Duo/Carré/Cash + ambiance thème
    QuizEnd.jsx      ← fin quiz score en points
    ManageQuestions.jsx ← CRUD questions libres + wrong_answers
```

**Onglet Mémoire 🧠**
- Bottom nav badge dues filtrée sur decks actifs du profil
- Barres de progression par critère interrogeable + fond coloré global
- Filtre decks par profil : ⚙️ → actif/inactif, grisé si inactif, localStorage
- Créer deck manuellement (FAB +) → redirige ManageDeck
- Import JSON : format classique `front/back` + nouveau `criteria/values`
- Répétition espacée par (carte × critère), algo priorité sans shuffle pur
- Seuil maîtrise : `level >= 4` (2× Facile)
- `interrogeable: false` → réponse uniquement, jamais question
- Révélation en place (fade), lien Wikipédia

**Onglet Quiz ⚡**
- Modes : Duo 1pt / Carré 3pts / Cash 5pts (texte libre)
- Jauge difficulté 3 points + ambiance couleur par thème
- Cash : Levenshtein dynamique, partielles, "Presque !"
- Paires via `quiz_answer_criterion_id` dans `deck_criteria`
- Questions libres avec `wrong_answers[]` manuelles (min 2)
- Diversification par thème (round-robin)

**Tables Supabase**
```sql
deck_criteria (id, deck_id, name, type, question_title, position,
  interrogeable boolean default true,
  quiz_answer_criterion_id uuid references deck_criteria(id))
card_values (id, card_id, criterion_id, value, unique(card_id,criterion_id))
card_progress (profile_id, card_id, criterion_id, level, next_review, last_reviewed)
quiz_questions (id, profile_id, question, answer, wrong_answers text[], theme, created_at)
```

**Notes DB**
- `cards.front`, `cards.back` : nullable
- RLS désactivé : `deck_criteria`, `card_values`, `quiz_questions`
- RLS actif : `card_progress` (filtré `profile_id`)

**localStorage**
- `memoire-active-decks-{profileId}` : array IDs actifs (null = tous)
- `memoire-singe-quiz-sources` : sources cochées Quiz

---

### 🌦️ Parapluie ou Claquettes
> Météo agrégée multi-modèles

**Ce qui marche**
- Multi-modèles météo (AROME, ICON, ECMWF, GFS, Météo France)
- Vue 7 jours + heure par heure
- Favoris multi-villes
- Filtre heures passées sur le jour courant ✅

**Améliorations prévues**
- Liens MétéoCiel / Weather24 configurables par ville
- Vue "résumé de la semaine"
- Ville par défaut Saint Antonin pour Princesse🚀 et Fuveau pour Be🐒

---

### 📖 Le Grimoire Gourmand
> Inspiration culinaire saisonnière

**Ce qui marche**
- Inspiration saisonnière via Spoonacular
- Sauvegarde de recettes (manuelles ou Spoonacular)
- Planning semaine avec PickRecipeModal
- Liste de courses intelligente (placard, déduplification)
- Gestion placard (`grimoire_settings` Supabase)
- Cache sessionStorage pour les traductions
- Prop `initialShoppingList` : ouvre directement l'onglet Semaine + modal courses

**Améliorations prévues**
- Traduction encore perfectible
- Recettes Spoonacular parfois en anglais

---

### 💌 Bisou
> Tableau d'humeur partagé entre les deux profils

**Ce qui marche**
- Emoji du moment + message optionnel (140 caractères max)
- Historique des derniers messages
- Badge 💗 animé sur la tuile du hub si message non lu
- Badge par profil (chacun son propre last-seen localStorage)

**Table Supabase**
```sql
create table bisou_messages (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id),
  emoji text not null,
  message text,
  created_at timestamp with time zone default now()
);
```

---

### 🗞️ Demandez le Programme !
> Agenda partagé entre les deux profils

**Ce qui marche**
- Vue liste des événements à venir, triés par date
- Vue mois avec calendrier visuel (navigation mois, pastilles événements, détail au clic)
- Événements passés masqués automatiquement
- Événements proches (≤ 3 jours) mis en avant visuellement (section "🔥 Très bientôt")
- Ajout : emoji + titre + date + heure optionnelle + note optionnelle + récurrence annuelle
- Suppression d'un événement
- Widget hub : prochain événement + compte à rebours cliquable

**Améliorations prévues**
- Modifier un événement existant
- Badge sur la tuile hub si événement dans les 3 jours
- Afficher l'âge pour les anniversaires (récurrence annuelle)
- Événements sur plusieurs jours

**Table Supabase**
```sql
create table programme_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  emoji text not null default '📅',
  event_date date not null,
  event_time time,
  note text,
  is_annual boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);
```

**Ce qu'on n'inclut pas**
- Pas de catégories, pas de rappels push, pas de sync Google Calendar
- Récurrence uniquement annuelle

---

### 💥 Mise en Orbite
> Suivi sportif et défis entre profils

**Ce qui marche**
- Activités trackées : 🚶 Marche (pas), 🏃 Course (km ou min), 🏋️ Renfo (min ou séances)
- Conversion en Props 🚀 avec taux configurables par profil
- Saisie manuelle avec aperçu Props en temps réel
- Face-à-face Be🐒 vs Princesse🚀 : barres de progression semaine en cours
- Streak 🔥 : jours consécutifs où l'objectif de Props journalier est atteint
- Message d'encouragement pour le profil qui est derrière
- Mission décollage 💥 : barre de progression fusée commune, objectif configurable
- Historique des 8 dernières semaines : vainqueur 🏆 + badge DÉCOLLAGE si objectif atteint
- Réglages : taux de conversion par activité + objectif journalier + objectif fusée hebdo
- Widget hub : jauge verticale bicolore (orange 🐒 / bleu 🚀) en colonne droite, cliquable

**Tables Supabase**
```sql
create table orbite_activities (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id),
  type text not null,
  value numeric not null,
  unit text not null,
  props integer not null,
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

**Améliorations prévues**
- Suppression d'une activité depuis le dashboard
- Défis ponctuels (objectif commun sur une durée libre)

---

## 🔨 Apps à construire

### 🍵 Tisane et Chauffeuse
> Films & séries à regarder ensemble

- Liste commune "à voir" + "déjà vu"
- Recherche via API TMDB (gratuite)
- Like / dislike par profil pour trouver un film en commun
- Notes après visionnage

---

### 🐌 Ça Traîne
> Todo partagée avec priorités croisées

- Liste de tâches commune
- Chaque profil définit son top 3 de priorité
- Liste triée selon les priorités combinées
- Tâche en top 3 des deux profils → remonte encore plus haut

---

### 🎸 Jukebox
> Morceaux partagés et humeur musicale

- Ajouter des morceaux à une liste commune
- Humeur musicale du moment (tag / emoji)
- *(specs à affiner)*

---

### 👣 Nos Empreintes
> Carte des lieux visités ensemble

- Carte interactive des endroits visités en couple
- Ajouter un lieu avec nom, date, note
- *(specs à affiner)*

---

### 💧 Arrose-moi
> Suivi arrosage des plantes intérieur

- Liste des plantes de la maison
- Date du dernier arrosage + fréquence
- Indicateur "à arroser bientôt"
- *(specs à affiner)*

---

### 🌙 Parenthèse
> Planifier une soirée ou activité spéciale à l'avance

- Proposer et planifier une soirée / activité couple à l'avance
- Adapté aux casaniers : week-end cosy, soirée canapé
- Notion d'anticipation (pas "ce soir" mais "ce week-end")
- *(specs à affiner)*
