// Moteur de validation pour le mode Cash (saisie libre)
// Extrait de QuizScreen.jsx pour être testable indépendamment.

function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1])
  return d[m][n]
}

function cashThreshold(len) {
  if (len <= 3)  return 0
  if (len <= 6)  return 1
  if (len <= 12) return 2
  return 3
}

/**
 * Vérifie si la saisie utilisateur correspond à la réponse attendue (mode Cash).
 * @returns {{ ok: boolean, exact: boolean, dist: number, partial?: boolean, presque?: boolean }}
 */
export function checkCash(input, answer) {
  const inp = normalize(input)
  const ans = normalize(answer)
  if (inp === ans) return { ok: true, exact: true, dist: 0 }
  const dist = levenshtein(inp, ans)
  const thr  = cashThreshold(ans.length)
  if (dist <= thr) return { ok: true, exact: false, dist }
  if (ans.includes(',') || ans.includes(';')) {
    const parts = ans.split(/[,;]/).map(p => p.trim()).filter(Boolean)
    for (const part of parts) {
      const d = levenshtein(inp, part)
      if (d <= cashThreshold(part.length)) return { ok: true, exact: d === 0, dist: d, partial: true }
    }
    if (ans.includes(inp) && inp.length >= 3) return { ok: true, exact: false, dist: 0, partial: true }
  }
  const presque = dist <= thr + 2
  return { ok: false, exact: false, dist, presque }
}
