// Abstraction localStorage partagée — parsing JSON automatique + fallback sécurisé

export const ls = {
  /** Lit une valeur depuis localStorage (JSON parsé). Retourne `fallback` si absente ou invalide. */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      return JSON.parse(raw) ?? fallback
    } catch {
      return fallback
    }
  },

  /** Écrit une valeur dans localStorage (JSON stringifié). */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // silencieux si storage plein
    }
  },

  /** Lit une valeur brute (string, sans parsing JSON). */
  getRaw(key, fallback = null) {
    return localStorage.getItem(key) ?? fallback
  },

  /** Écrit une valeur brute (string). */
  setRaw(key, value) {
    localStorage.setItem(key, String(value))
  },

  /** Supprime une clé. */
  remove(key) {
    localStorage.removeItem(key)
  },
}
