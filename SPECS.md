# 🏠 Mes Apps — Specs & État

> Plateforme personnelle React + Vite + Supabase  
> Déployée sur Vercel : [flashcard-ten-virid.vercel.app](https://flashcard-ten-virid.vercel.app)  
> Repo : [PokJungle/flashcard](https://github.com/PokJungle/flashcard)  
> Profils : Be🐒 / Princesse chat🚀

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
- Filtre heures passées sur le jour courant ✅ *(corrigé)*

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

## 🔨 Apps à construire

### 💌 Bisou
> Tableau d'humeur partagé entre les deux profils

**Specs**
- Emoji du moment + message optionnel (140 caractères max)
- Historique des derniers messages
- Badge 💗 animé sur la tuile du hub si message non lu
- Badge par profil (chacun son propre last-seen)
- Pas de notifications push — on voit en ouvrant l'app

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

**Specs**
- Vue liste des événements à venir, triés par date
- Vue semaine / mois (switch)
- Chaque événement : emoji + titre + date + compte à rebours ("dans 3 jours")
- Événements passés masqués automatiquement
- Événements proches (≤ 3 jours) mis en avant visuellement
- Widget sur l'accueil : prochain événement cliquable

**Ajouter un événement**
- Titre + emoji + date + heure (optionnelle) + note (optionnelle)
- Option récurrence annuelle (pour les anniversaires)
- Visible par les deux profils

**Ce qu'on n'inclut pas**
- Pas de catégories
- Pas de rappels push
- Pas de synchronisation Google Calendar
- Récurrence uniquement annuelle (pas hebdo / mensuel)

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
- La liste s'affiche triée selon les priorités combinées
- Une tâche mise en top 3 par les **deux** profils remonte encore plus haut

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
- Notion d'anticipation (pas "ce soir" mais "ce week-end" / "le mois prochain")
- *(specs à affiner)*

---

## 🗂️ Structure du projet

```
src/
├── App.jsx
├── supabase.js
├── main.jsx
└── apps/
    ├── Flashcards/
    │   ├── index.jsx
    │   ├── constants.js
    │   ├── hooks/useFlashcards.js
    │   ├── screens/HomeScreen.jsx
    │   ├── screens/StudyScreen.jsx
    │   ├── screens/CuriositiesScreen.jsx
    │   ├── screens/ManageScreen.jsx
    │   ├── components/FlipCard.jsx
    │   ├── components/ImageModal.jsx
    │   └── components/UploadModal.jsx
    ├── Meteo/
    │   └── index.jsx
    ├── Grimoire/
    │   └── index.jsx
    └── Bisou/
        └── index.jsx
```
