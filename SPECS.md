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
- Sauvegarde de recettes (Spoonacular + saisie manuelle)
- Planning semaine avec popup de sélection directe depuis le jour
- Bouton ✏️ Modifier accessible depuis la vue recette
- Liste de courses avec agrégation et exclusion placard configurable
- Cache sessionStorage 1h (recherches, détails, traductions, titres)
- Traduction par appels individuels, robuste
- Affichage ingrédients : nom principal + note grise italique

**Table Supabase**
- `recipes` : recettes sauvegardées
- `meal_plan` : planning semaine par profil
- `grimoire_settings` : paramètres par profil (placard)

**Améliorations prévues**
- Traduction encore perfectible (termes anglais résiduels)
- Agrégation liste de courses perfectible pour recettes manuelles

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

**Améliorations prévues**
- La notification est un peu aléatoire

---

## 🔨 Apps à construire

### 🗞️ Demandez le Programme !
> Agenda partagé entre les deux profils

**Specs**
- Vue liste des événements à venir, triés par date
- Vue semaine / mois (switch)
- Chaque événement : emoji + titre + date + compte à rebours ("dans 3 jours")
- Événements passés masqués automatiquement
- Événements proches (≤ 3 jours) mis en avant visuellement
- Widget sur l'accueil du hub : prochain événement cliquable

**Ajouter un événement**
- Titre + emoji + date + heure (optionnelle) + note (optionnelle)
- Option récurrence annuelle (pour les anniversaires)
- Visible par les deux profils

**Ce qu'on n'inclut pas**
- Pas de catégories
- Pas de rappels push
- Pas de synchronisation Google Calendar
- Récurrence uniquement annuelle

---

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