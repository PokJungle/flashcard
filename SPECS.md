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
| `src/apps/Flashcards/hooks/useFlashcards.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/hooks/useFlashcards.js |
| `src/apps/Flashcards/screens/HomeScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/HomeScreen.jsx |
| `src/apps/Flashcards/screens/StudyScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/StudyScreen.jsx |
| `src/apps/Flashcards/screens/CuriositiesScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/CuriositiesScreen.jsx |
| `src/apps/Flashcards/screens/ManageScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/screens/ManageScreen.jsx |
| `src/apps/Flashcards/components/FlipCard.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/components/FlipCard.jsx |
| `src/apps/Flashcards/components/ImageModal.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/components/ImageModal.jsx |
| `src/apps/Flashcards/components/UploadModal.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Flashcards/components/UploadModal.jsx |
| `src/apps/Meteo/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Meteo/index.jsx |
| `src/apps/Grimoire/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Grimoire/index.jsx |
| `src/apps/Bisou/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Bisou/index.jsx |
| `src/apps/Programme/index.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/index.jsx |
| `src/apps/Programme/hooks/useProgramme.js` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/hooks/useProgramme.js |
| `src/apps/Programme/screens/HomeScreen.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/screens/HomeScreen.jsx |
| `src/apps/Programme/screens/AddEventModal.jsx` | https://raw.githubusercontent.com/PokJungle/flashcard/refs/heads/main/src/apps/Programme/screens/AddEventModal.jsx |

---

## ✅ Apps existantes

### 🐒 Mémoire de Singe
> Révision par répétition espacée

**Ce qui marche**
- Répétition espacée (algorithme niveau + next_review)
- Curiosités du jour (mix perso + thématique)
- Images uploadables par carte
- Multi-profils

**Améliorations prévues**
- Multi-critères par carte (nom / drapeau / capitale)
- Stats de progression par jeu
- Indicateur cartes dues sur l'accueil
- Gestion curiosités (modifier / supprimer)

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

---

### 📖 Le Grimoire Gourmand
> Inspiration culinaire saisonnière

**Ce qui marche**
- Inspiration saisonnière via Spoonacular
- Sauvegarde de recettes
- Planning semaine
- Liste de courses

**Améliorations prévues**
- Traduction encore perfectible
- Agrégation liste de courses à affiner
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
- Hub condensé 3 colonnes sans sous-texte

**Améliorations prévues**
- Modifier un événement existant
- Badge sur la tuile hub si événement dans les 3 jours
- Afficher l'âge pour les anniversaires (récurrence annuelle)
- Événements sur plusieurs jours (date de début + date de fin)

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
- Pas de catégories
- Pas de rappels push
- Pas de synchronisation Google Calendar
- Récurrence uniquement annuelle

---

## 🔨 Apps à construire

### 🍵 Tisane et Chauffeuse
> Films & séries à regarder ensemble

**Specs**
- Liste commune "à voir" + "déjà vu"
- Recherche via API TMDB (gratuite)
- Like / dislike par profil pour trouver un film en commun
- Notes après visionnage

---

### 💥 Mise en Orbite
> Suivi sportif et défis entre profils

**Specs**
- Les activités sont converties en **Props** (propergol 🚀)
- Exemples : 1000 pas = 1000 Props, renfo 15 min = x Props
- Défis Be🐒 vs Princesse chat🚀
- Classement par jour / semaine / mois
- Streak

---

### 🐌 Ça Traîne
> Todo partagée avec priorités croisées

**Specs**
- Liste de tâches commune
- Chaque profil définit son top 3 de priorité
- Liste triée selon les priorités combinées
- Tâche en top 3 des deux profils → remonte encore plus haut

---

### 🎸 Jukebox
> Morceaux partagés et humeur musicale

**Specs**
- Ajouter des morceaux à une liste commune
- Humeur musicale du moment (tag / emoji)
- *(specs à affiner)*

---

### 👣 Nos Empreintes
> Carte des lieux visités ensemble

**Specs**
- Carte interactive des endroits visités en couple
- Ajouter un lieu avec nom, date, note
- *(specs à affiner)*

---

### 💧 Arrose-moi
> Suivi arrosage des plantes intérieur

**Specs**
- Liste des plantes de la maison
- Date du dernier arrosage + fréquence
- Indicateur "à arroser bientôt"
- *(specs à affiner)*

---

### 🌙 Parenthèse
> Planifier une soirée ou activité spéciale à l'avance

**Specs**
- Proposer et planifier une soirée / activité couple à l'avance
- Adapté aux casaniers : week-end cosy, soirée canapé
- Notion d'anticipation (pas "ce soir" mais "ce week-end")
- *(specs à affiner)*
