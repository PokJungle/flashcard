const SPOONACULAR_KEY = import.meta.env.VITE_SPOONACULAR_KEY
const CACHE_PREFIX = 'grimoire_cache_'
const CACHE_TTL = 60 * 60 * 1000

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { value, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_PREFIX + key); return null }
    return value
  } catch { return null }
}

function cacheSet(key, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, ts: Date.now() }))
  } catch {
    try {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX))
      if (keys.length > 0) { sessionStorage.removeItem(keys[0]); sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, ts: Date.now() })) }
    } catch { }
  }
}

export async function translateOne(text, langpair = 'en|fr') {
  if (!text?.trim()) return text
  const cacheKey = `tr_${langpair}_${text.slice(0, 120)}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`)
    const d = await r.json()
    const result = d.responseData?.translatedText || text
    cacheSet(cacheKey, result)
    return result
  } catch { return text }
}

export async function translateBatch(texts, langpair = 'en|fr', batchSize = 4, delayMs = 250) {
  const results = new Array(texts.length)
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const translated = await Promise.all(batch.map(t => translateOne(t, langpair)))
    translated.forEach((t, j) => { results[i + j] = t })
    if (i + batchSize < texts.length) await new Promise(r => setTimeout(r, delayMs))
  }
  return results
}

export async function translateRecipe(recipe) {
  const ingredients = recipe.extendedIngredients?.map(i => i.original) || []
  const steps = recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step) || []
  const allTexts = [recipe.title, ...ingredients, ...steps]
  const allTranslated = await translateBatch(allTexts)
  return {
    title: allTranslated[0] || recipe.title,
    ingredients: allTranslated.slice(1, 1 + ingredients.length),
    steps: allTranslated.slice(1 + ingredients.length),
  }
}

export async function searchRecipes(query, filters = {}) {
  const key = `search_${query}_${JSON.stringify(filters)}`
  const cached = cacheGet(key)
  if (cached) return cached
  const params = new URLSearchParams({ apiKey: SPOONACULAR_KEY, query, number: 12 })
  if (filters.vegetarian) params.set('diet', 'vegetarian')
  if (filters.maxTime) params.set('maxReadyTime', filters.maxTime)
  const r = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`)
  const d = await r.json()
  const results = d.results || []
  cacheSet(key, results)
  return results
}

export async function getRecipeDetails(id) {
  const key = `detail_${id}`
  const cached = cacheGet(key)
  if (cached) return cached
  const r = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_KEY}&includeNutrition=false`)
  const d = await r.json()
  cacheSet(key, d)
  return d
}

export async function getTranslatedRecipeDetails(id) {
  const key = `translated_${id}`
  const cached = cacheGet(key)
  if (cached) return cached
  const details = await getRecipeDetails(id)
  const translated = await translateRecipe(details)
  const result = {
    ...details,
    title: translated.title,
    extendedIngredients: (details.extendedIngredients || []).map((ing, i) => ({ ...ing, original: translated.ingredients[i] || ing.original })),
    analyzedInstructions: [{ steps: (translated.steps || []).map((step, i) => ({ step, number: i + 1 })) }],
    _translated: true,
  }
  cacheSet(key, result)
  return result
}
