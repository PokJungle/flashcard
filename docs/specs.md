# Specs — Apps à construire

> Apps en préparation pour la plateforme BBP (Be🐒 / Princesse chat🚀).
> Pour les apps déjà en production, voir les fichiers `docs/apps/*.md`.

---

## 🍵 Tisane et Chauffeuse

### 📄 Spécifications Fonctionnelles : 

#### 1. Vision du Produit
**Concept :** App Duo Ciné/Série. Une application pour couples permettant de décider rapidement quoi regarder, en transformant la recherche en un jeu de "swipe" et en centralisant le suivi des séries.
**Objectif :** Zéro friction, aide à la décision rapide, interface moderne "Ciné Cosy".

---

#### 2. Structure de l'Interface (Arborescence)

##### A. Onglet Principal : La Watchlist (Home)
Pivot central de l'app, divisé en deux sections via un toggle permanent.

* **Section FILMS :**
    * **Groupe "Matchs" :** Films validés par les deux (❤️+❤️). Priorité haute.
    * **Groupe "À voir" :** Films ajoutés via "Découvrir" ou suggérés par un seul partenaire.
* **Section SÉRIES :**
    * **Groupe "En cours" :** Séries entamées avec suivi à l'épisode. Alerte visuelle si un nouvel épisode est sorti sur TMDB.
    * **Groupe "Matchs" :** Nouvelles séries validées en duo, prêtes à être lancées.
    * **Groupe "À voir" :** Idées de séries stockées en attente de validation.

##### B. Onglet : Match (Le Jeu)
Interface de décision dynamique pour le couple.
* **Sources du Match :** Option de piocher dans "Notre Watchlist" (pour trancher) ou dans le "Catalogue Global" (pour découvrir).
* **UI de la Carte (Swipe) :**
    * **Face A (Visuel) :** Affiche plein écran, Titre, Note TMDB, Année.
    * **Face B (Détails) :** S'affiche via un "Tap" court sur la carte. Présente le résumé (max 300 caractères), le casting principal, la durée (ou nb de saisons) et les logos des plateformes (Netflix, Prime, etc.).
* **Actions :** ❤️ (Match), 😬 (Plus tard), ⏭️ (Passer sans juger).
* **Mode “Ce soir” :** Filtre restrictif pour une session de match ultra-courte (ex: "un film de moins d'1h40").

##### C. Onglet : Découvrir
* Barre de recherche textuelle via API TMDB.
* Exploration par genres, tendances et plateformes de streaming.
* Bouton d'ajout rapide vers la Watchlist "À voir".

---

#### 3. Logique Métier & Fonctionnalités Clés

##### Le Système de "Veto"
* **Concept :** Un droit de retrait définitif pour éviter les propositions répétées d'un contenu non désiré.
* **Fonctionnement :** Système de 3 jetons Veto par utilisateur.
* **Recharge :** Chaque jeton utilisé met 7 jours à se régénérer.
* **Effet :** Supprime immédiatement le média de la session de match et de la Watchlist commune.

##### Suivi des Séries (Inspiration JustWatch)
* Gestion par saison et par épisode.
* Bouton "+" rapide pour marquer l'épisode en cours comme "vu".
* Mise à jour automatique du statut de la série dès le premier épisode visionné (passe de "Match" à "En cours").

##### Données & API
* **Source :** API TMDB pour les métadonnées et les fournisseurs de streaming (Watch Providers).
* **Backend recommandé :** Solution temps réel (Supabase/Firebase) pour synchroniser instantanément les actions des deux utilisateurs sur leurs écrans respectifs.

---

#### 4. Design & UI
* **Couleurs :** Violet nuit (fond), Ambre (call-to-action), Blanc cassé (lecture).
* **CTA Principal unique :** Un bouton central "On lance un match" pour inciter à l'action.
* **Ergonomie :** Navigation par onglets en bas, gestuelles de swipe fluides.

---

## 🎧 MoodBoombox

### Résumé
Partager des sons selon l’humeur, sans refaire Spotify, et garder une mémoire musicale du couple.

### Fonctionnalités clés (MVP)
1. **Ajouter un morceau** via lien (YouTube/Spotify/Deezer)
2. **Tag humeur** avec emoji (😎 chill, 💃 énergie, 🌧️ mélancolie)
3. **Playlist du moment** automatique selon humeur commune
4. **Timeline “nos sons”** (souvenirs musicaux datés)
5. **Mini jeu “devine qui a ajouté ce son”**

### API gratuite
- **iTunes Search API** (sans auth) pour métadonnées basiques
- Option: **Deezer API** (usage gratuit, à vérifier selon quota)

### UI moderne & ergonomique
- Chips d’humeur colorées
- Cover art en mosaïque
- Player léger (preview quand disponible)

---

## 👣 Nos Empreintes

### Résumé
Créer une mémoire géographique du couple: lieux visités, moments, anecdotes.

### Fonctionnalités clés (MVP)
1. **Carte des lieux visités** (pins + clustering)
2. **Ajout rapide d’un lieu** (nom, date, note, photo optionnelle)
3. **Filtres** (ville, type de sortie, période)
4. **Stats fun** (km cumulés, pays, top souvenirs)
5. **Mode “souvenir aléatoire”**

### API gratuite
- **Nominatim (OpenStreetMap)** pour géocodage
- **Leaflet + OpenStreetMap tiles** côté front

### UI moderne & ergonomique
- Carte plein écran + drawer bottom sheet
- Timeline des visites
- Marqueurs custom emoji


---

## 💧 Arrose-moi

### Résumé
Aider à entretenir les plantes sans charge mentale, avec des rappels simples et visuels.

### Fonctionnalités clés (MVP)
1. **Fiches plantes** (nom, pièce, fréquence)
2. **Planning d’arrosage** (aujourd’hui / bientôt / en retard)
3. **Bouton “Arrosé !”** en 1 tap
4. **Historique minimal** (derniers arrosages)
5. **Astuce du jour** (lumière, humidité, erreurs courantes)

### API gratuite
- MVP sans API obligatoire
- Option: **Perenual API** (free tier) pour fiches plantes

### UI moderne & ergonomique
- Codes couleur lisibles (vert/ambre/rouge)
- Cartes “urgence” en tête
- Animation goutte d’eau au check

---

## 🌙 Parenthèse

### Résumé
Planifier des moments spéciaux à l’avance, surtout des activités cocooning.

### Fonctionnalités clés (MVP)
1. **Boîte à idées d’activités** (maison / extérieur / petit budget)
2. **Planification future** (ce week-end, semaine prochaine)
3. **Vote duo** pour choisir l’activité
4. **Checklist préparation** (snacks, ambiance, musique)
5. **Souvenir post-activité** (photo + note + emoji)

### API gratuite
- MVP sans API
- Option inspiration météo via **Open-Meteo** (déjà cohérent avec stack)

### UI moderne & ergonomique
- Cartes ambiance (cosy, aventure, créatif)
- Frise “prochaines parenthèses”
- Ton visuel doux (indigo nuit + rose chaud)

---

## La quête
- Défis courts quotidiens (ex: “faire 10 min sans écran ensemble”)
- Système de streak duo + récompenses cosmétiques
- Sans API (ou citations motivantes via API gratuite)

## Dodo 😴
- Rituel sommeil à deux (heure de coucher cible, routine)
- Suivi de régularité hebdo
- Ambiances sonores via liens externes
- Sans API

## Photo Capsule 📸🧡
- 1 photo/jour max, capsule mensu “souvenirs”
- Reveal du fin du mois
- Sans API (stockage Supabase), trouver un système de gestion des photos pour ne pas faire trop grossir la BDD. Un fois le mois passé et le récap vu on supprime les photos.

