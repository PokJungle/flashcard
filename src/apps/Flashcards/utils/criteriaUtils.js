// Utilitaires partagés pour les critères de deck (utilisés dans useMemoire, useStudySession, useQuiz)

/**
 * Retourne les critères interrogeables d'un deck.
 * Exclut les critères marqués `interrogeable: false` et les critères nommés "verso".
 */
export function getActiveCriteria(criteria) {
  return (criteria || []).filter(c => c.interrogeable !== false && c.name !== 'verso')
}
