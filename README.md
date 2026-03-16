# 🏠 Mes Apps

Plateforme d'applications personnelles pour **Be🐒** et **Princesse chat🚀**.

🌐 [flashcard-ten-virid.vercel.app](https://flashcard-ten-virid.vercel.app)

---

## Stack

- **React + Vite** — UI
- **Tailwind CSS** — styles
- **Supabase** — base de données & stockage
- **Vercel** — déploiement

---

## Apps

| App | Description | Statut |
|-----|-------------|--------|
| 🐒 Mémoire de Singe | Flashcards par répétition espacée | ✅ En ligne |
| 🌦️ Parapluie ou Claquettes | Météo agrégée multi-modèles | ✅ En ligne |
| 📖 Le Grimoire Gourmand | Recettes saisonnières via Spoonacular | ✅ En ligne |
| 💌 Bisou | Messagerie emoji intime entre profils | ✅ En ligne |
| 🗞️ Demandez le Programme ! | Agenda partagé avec compte à rebours | 🔨 À construire |
| 🍵 Tisane et Chauffeuse | Films & séries via TMDB | 🔨 À construire |
| 💥 Mise en Orbite | Sport converti en Props 🚀, défis | 🔨 À construire |
| 🐌 Ça Traîne | Todo partagée avec priorités croisées | 🔨 À construire |
| 🎸 Jukebox | Playlist et humeur musicale partagées | 🔨 À construire |
| 👣 Nos Empreintes | Carte des lieux visités ensemble | 🔨 À construire |
| 💧 Arrose-moi | Suivi arrosage des plantes intérieur | 🔨 À construire |
| 🌙 Parenthèse | Planifier une soirée spéciale à l'avance | 🔨 À construire |

> Specs détaillées → [SPECS.md](./SPECS.md)

---

## Structure

```
src/
├── App.jsx
├── supabase.js
└── apps/
    ├── Flashcards/
    │   ├── index.jsx
    │   ├── constants.js
    │   ├── hooks/useFlashcards.js
    │   ├── screens/
    │   └── components/
    ├── Meteo/
    │   └── index.jsx
    ├── Grimoire/
    │   └── index.jsx
    └── Bisou/
        └── index.jsx
```

---

## Démarrage local

```bash
npm install
npm run dev
```

Variables d'environnement à créer dans `.env` :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SPOONACULAR_API_KEY=...
```