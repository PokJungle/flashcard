# Specs — Apps à construire

> Apps en préparation pour la plateforme BBP (Be🐒 / Princesse chat🚀).
> Pour les apps déjà en production, voir les fichiers `docs/apps/*.md`.

---

## 🍵 Tisane et Chauffeuse

### Résumé
Construire une app duo pour décider vite quoi regarder ensemble, avec une dynamique ludique et une friction minimale.

### Fonctionnalités clés (MVP)
1. **Watchlist partagée** (à voir / vu / abandonné)
2. **Recherche multi-critères** (genre, durée, plateforme, année)
3. **Swipe duo** (❤️ / 😬 / ⏭️) pour matcher un film/série
4. **Mode “Ce soir”**: filtre ultra-court pour trancher en 60 secondes
5. **Post-visionnage**: note rapide + emoji humeur
6. Deux parties distinctes Film et Série (s'inspirer de l'application JustWatch, suivi des séries épisodes par épisodes...)

### API gratuite
- **TMDB API** (gratuit avec clé)
- Option “où regarder” via provider TMDB (selon région)

### UI moderne & ergonomique
- Cartes verticales type swipe
- Couleurs “ciné cosy” (violet nuit + ambre)
- CTA principal unique: **“On lance un match”**

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

