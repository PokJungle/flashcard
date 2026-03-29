# Specs — Apps à construire

> Apps en préparation pour la plateforme BBP (Be🐒 / Princesse chat🚀).
> Pour les apps déjà en production, voir les fichiers `docs/apps/*.md`.

---

## 🍷 Canon
> Cave à vin partagée — stock & journal de dégustation

**Une app, deux onglets : Cave 🏚️ / Journal 📓**

### Onglet Cave 🏚️

**Ajouter une bouteille**
- Barre de recherche texte → autocomplete via Wine-Searcher API (100 calls/jour gratuits)
- Sélection en 1 tap → fiche pré-remplie (appellation, domaine, millésime, couleur)
- Champs éditables avant validation : quantité, emplacement, note d'achat

**Schéma de la cave**
- Représentation visuelle de la cave avec zones cliquables
- Zones configurables par l'utilisateur (nom libre : "Étagère A", "Casier rouge"…)
- Chaque bouteille est assignée à une zone, visible sur le schéma
- Vue d'ensemble : densité / occupation par zone

**Liste du stock**
- Filtres : couleur, appellation, millésime, zone
- Quantité restante visible directement en liste
- Bouton **"Bu 🍷"** depuis la fiche → modal rapide :
  - Date (auto = aujourd'hui, modifiable)
  - Note de dégustation optionnelle (texte libre)
  - Note ⭐ (sur 5) + coup de cœur ❤️ optionnel
  - → Quantité −1, entrée basculée automatiquement dans le Journal

### Onglet Journal 📓

**Toutes les bouteilles bues** (depuis la cave + ajout direct hors cave)

**Ajouter une dégustation hors cave**
- Même recherche texte que la cave
- Fiche pré-remplie + note ⭐ + ❤️ + commentaire libre + date

**Palmarès**
- Top vins par : couleur (Rouge / Blanc / Rosé / Effervescent), région, cépage
- Coups de cœur ❤️ mis en avant visuellement
- Vue "ensemble" (les deux profils) ou "par profil"

### Multi-profils
- Cave partagée via Supabase (stock commun, visible par les deux profils)
- Notes de dégustation individuelles (chacun ses ⭐, chacun ses ❤️)
- Auteur affiché sur chaque note

### Tables Supabase (à créer)

```sql
create table canon_bottles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text,
  appellation text,
  vintage integer,
  color text check (color in ('rouge', 'blanc', 'rosé', 'effervescent')),
  region text,
  grape text,
  quantity integer default 1,
  zone text,
  purchase_note text,
  created_at timestamp with time zone default now()
);

create table canon_tastings (
  id uuid default gen_random_uuid() primary key,
  bottle_id uuid references canon_bottles(id) on delete set null,
  profile_id uuid references profiles(id),
  name text not null,
  domain text,
  appellation text,
  vintage integer,
  color text,
  region text,
  grape text,
  rating numeric(2,1) check (rating between 0 and 5),
  is_favorite boolean default false,
  note text,
  tasted_at date default current_date,
  created_at timestamp with time zone default now()
);
```

### Améliorations prévues
- Scan d'étiquette via IA (photo → champs pré-remplis)
- Alerte "dernière bouteille" quand quantité = 1
- Suggestions "à ouvrir bientôt" selon millésime

---

## 🍵 Tisane et Chauffeuse
> Films & séries à regarder ensemble

- Liste commune "à voir" + "déjà vu"
- Recherche via API TMDB (gratuite)
- Like / dislike par profil pour trouver un film en commun
- Notes après visionnage

---

## 🐌 Ça Traîne
> Todo partagée avec priorités croisées

- Liste de tâches commune
- Chaque profil définit son top 3 de priorité
- Liste triée selon les priorités combinées
- Tâche en top 3 des deux profils → remonte encore plus haut

---

## 🎸 Jukebox
> Morceaux partagés et humeur musicale

- Ajouter des morceaux à une liste commune
- Humeur musicale du moment (tag / emoji)
- *(specs à affiner)*

---

## 👣 Nos Empreintes
> Carte des lieux visités ensemble

- Carte interactive des endroits visités en couple
- Ajouter un lieu avec nom, date, note
- *(specs à affiner)*

---

## 💧 Arrose-moi
> Suivi arrosage des plantes intérieur

- Liste des plantes de la maison
- Date du dernier arrosage + fréquence
- Indicateur "à arroser bientôt"
- *(specs à affiner)*

---

## 🌙 Parenthèse
> Planifier une soirée ou activité spéciale

- Proposer et planifier une soirée / activité couple à l'avance
- Adapté aux casaniers : week-end cosy, soirée canapé
- Notion d'anticipation (pas "ce soir" mais "ce week-end")
- *(specs à affiner)*
