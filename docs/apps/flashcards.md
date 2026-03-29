# 🐒 Mémoire de Singe — Documentation

## Architecture

```
src/apps/Flashcards/
├── index.jsx
├── constants.js          # THEMES, TABS, SCREENS, QUIZ_SOURCES_KEY
├── utils.js              # compressImage()
├── hooks/
│   ├── useMemoire.js     # Chargement decks + dues + progression
│   ├── useStudySession.js # Algo répétition espacée
│   └── useQuiz.js        # Session QCM Duo/Carré/Cash
├── screens/
│   ├── HomeMemoire.jsx
│   ├── HomeQuiz.jsx
│   ├── StudyScreen.jsx
│   ├── SessionEnd.jsx
│   ├── QuizScreen.jsx
│   ├── QuizEnd.jsx
│   ├── ManageDeck.jsx
│   └── ManageQuestions.jsx
└── components/
    ├── FlipCard.jsx
    ├── ImageModal.jsx
    └── UploadModal.jsx
```

## Modèle multi-critères

Un deck est comme un tableur : chaque colonne est un **critère** (`deck_criteria`), chaque ligne est une **carte** (`cards`), chaque cellule est une **valeur** (`card_values`).

- `interrogeable: false` → ce critère est utilisé uniquement comme réponse, jamais posé en question
- `quiz_answer_criterion_id` → lie un critère à son critère-réponse pour le QCM

**ManageDeck** : gestion quota, création/suppression critères et cartes
**SessionEnd** : récap session + progression complète du deck par critère

## Algorithme de répétition espacée

La répétition opère au niveau du **critère** (colonne), pas de la carte.

- **5 niveaux** (0–4) : level 4 = maîtrisé (`level >= 4` après 2× Facile)
- **Intervalles** : ~1h → 8h → 24h → 72h
- **Quota journalier** : `memoire-new-per-day-{deckId}`, options 5/10/20/∞
- **Calcul du badge** : `min(quota - faites aujourd'hui, à faire + jamais vues dispo)` → 0 si quota atteint
- **Session** : 1 critère par carte par session (aléatoire), limite en questions (pas en items)
- **Modes de lancement** : 🐇 10 / 🐒 20 / 🐘 MAX questions
- Révélation en place (fade), lien Wikipedia disponible

Logique centrale dans `useStudySession.js`.

## Quiz QCM

- **Duo** 1pt / **Carré** 3pts / **Cash** 5pts (saisie libre)
- Cash : distance de Levenshtein dynamique, réponses partielles, retour "Presque !"
- Paires via `quiz_answer_criterion_id` dans `deck_criteria`
- Diversification par thème (round-robin)
- Questions libres avec `wrong_answers[]` manuelles (min 2 requises)

## Import de decks

Format JSON supporté :
```json
// Format classique
[{ "front": "...", "back": "..." }]

// Format multi-critères
{
  "criteria": [{ "name": "...", "type": "text", "position": 0 }],
  "values": [{ "criterion_0": "valeur", "criterion_1": "valeur" }]
}
```

## Gestion des images

1. Compression côté client via `utils.js → compressImage()` (max 800px, qualité 0.7, canvas)
2. Upload dans Supabase Storage
3. `image_path` stocké sur la ligne `cards`
4. Affiché dans `<FlipCard>` avec `<ImageModal>` pour vue plein écran
5. Images Wikipedia récupérées via `/api/proxy.js` (proxy CORS côté serveur)

## Tables Supabase

- **`decks`** — `id`, `name`, `description`, `theme_id`, `created_at`
- **`cards`** — `id`, `deck_id`, `front`, `back`, `image_path`
- **`deck_criteria`** — `id`, `deck_id`, `name`, `type`, `question_title`, `position`, `interrogeable boolean`, `quiz_answer_criterion_id uuid` — RLS désactivé
- **`card_values`** — `id`, `card_id`, `criterion_id`, `value` — contrainte unique `(card_id, criterion_id)` — RLS désactivé
- **`card_progress`** — `id`, `profile_id`, `card_id`, `criterion_id`, `level` (0–4), `next_review`, `last_reviewed` — **RLS activé**
- **`quiz_questions`** — `id`, `profile_id`, `question`, `answer`, `wrong_answers text[]`, `theme` — RLS désactivé

## Clés localStorage

```
memoire-active-decks-{profileId}     # JSON array d'IDs de decks actifs
memoire-new-per-day-{deckId}         # quota nouvelles cartes/jour (défaut 10)
memoire-new-seen-{deckId}-{date}     # nouvelles cartes vues aujourd'hui (reset auto)
memoire-done-today-{deckId}-{date}   # questions faites aujourd'hui (reset auto)
memoire-session-mode-{deckId}        # dernier mode choisi (rapide/normal/marathon)
memoire-singe-quiz-sources           # JSON object (toggle sources Quiz)
```
