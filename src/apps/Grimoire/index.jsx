import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { ArrowLeft, Search, BookOpen, ShoppingCart, Plus, X, Check, Clock, Users } from 'lucide-react'

const SPOONACULAR_KEY = import.meta.env.VITE_SPOONACULAR_KEY

function getCurrentSeason() {
  const now = new Date()
  const m = now.getMonth() + 1
  const d = now.getDate()
  if ((m === 3 && d >= 20) || m === 4 || m === 5 || (m === 6 && d < 21)) return 'printemps'
  if ((m === 6 && d >= 21) || m === 7 || m === 8 || (m === 9 && d < 23)) return 'été'
  if ((m === 9 && d >= 23) || m === 10 || m === 11 || (m === 12 && d < 21)) return 'automne'
  return 'hiver'
}

const SEASON_INGREDIENTS = {
  printemps: { en: ['asparagus', 'peas', 'artichoke', 'spinach', 'radish', 'strawberry'], fr: ['asperges', 'petits pois', 'artichaut', 'épinards', 'radis', 'fraises'] },
  été:       { en: ['tomato', 'zucchini', 'eggplant', 'pepper', 'cucumber', 'peach'],     fr: ['tomates', 'courgettes', 'aubergine', 'poivron', 'concombre', 'pêche'] },
  automne:   { en: ['pumpkin', 'mushroom', 'leek', 'carrot', 'apple', 'pear'],            fr: ['potiron', 'champignons', 'poireaux', 'carottes', 'pommes', 'poires'] },
  hiver:     { en: ['leek', 'cabbage', 'cauliflower', 'brussels sprouts', 'potato', 'citrus'], fr: ['poireaux', 'chou', 'chou-fleur', 'choux de Bruxelles', 'pommes de terre', 'agrumes'] },
}
const SEASON_EMOJIS = { printemps: '🌸', été: '☀️', automne: '🍂', hiver: '❄️' }

async function translateToEn(text) {
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`)
    const d = await r.json()
    return d.responseData?.translatedText || text
  } catch { return text }
}

async function translateChunk(text) {
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`)
    const d = await r.json()
    return d.responseData?.translatedText || text
  } catch { return text }
}

async function translateRecipe(recipe) {
  const SEP_IN = ' <s/> '
  const SEP_OUT = /<s\s*\/?>/gi
  const ingredients = recipe.extendedIngredients?.map(i => i.original) || []
  const steps = recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step) || []
  const parts = [recipe.title, ...ingredients, ...steps]
  const chunks = []
  let current = ''
  for (const part of parts) {
    const candidate = current ? current + SEP_IN + part : part
    if (candidate.length > 400 && current) { chunks.push(current); current = part }
    else current = candidate
  }
  if (current) chunks.push(current)
  const translated = []
  for (const chunk of chunks) {
    const result = await translateChunk(chunk)
    translated.push(...result.split(SEP_OUT).map(s => s.trim()))
    await new Promise(r => setTimeout(r, 200))
  }
  return {
    title: translated[0] || recipe.title,
    ingredients: translated.slice(1, 1 + ingredients.length),
    steps: translated.slice(1 + ingredients.length),
  }
}

const recipeCache = {}

async function searchRecipes(query, filters = {}) {
  const key = `search_${query}_${JSON.stringify(filters)}`
  if (recipeCache[key]) return recipeCache[key]
  const params = new URLSearchParams({ apiKey: SPOONACULAR_KEY, query, number: 12 })
  if (filters.vegetarian) params.set('diet', 'vegetarian')
  if (filters.maxTime) params.set('maxReadyTime', filters.maxTime)
  const r = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`)
  const d = await r.json()
  const results = d.results || []
  recipeCache[key] = results
  return results
}

async function getRecipeDetails(id) {
  const key = `detail_${id}`
  if (recipeCache[key]) return recipeCache[key]
  const r = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_KEY}&includeNutrition=false`)
  const d = await r.json()
  recipeCache[key] = d
  return d
}

function getStartOfWeek() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function Grimoire({ profile }) {
  const [tab, setTab] = useState('inspiration')
  const [recipes, setRecipes] = useState([])
  const [savedRecipes, setSavedRecipes] = useState([])
  const [mealPlan, setMealPlan] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ vegetarian: false, maxTime: null })
  const [showFilters, setShowFilters] = useState(false)
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [showAddManual, setShowAddManual] = useState(false)
  const [manualRecipe, setManualRecipe] = useState({
    title: '', image_url: '', ready_in_minutes: '', servings: '',
    ingredients: [''], instructions: [''], vegetarian: false
  })
  const season = getCurrentSeason()

  useEffect(() => { loadSaved(); loadMealPlan() }, [])

  const loadSaved = async () => {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    setSavedRecipes(data || [])
  }

  const loadMealPlan = async () => {
    const week = getStartOfWeek()
    const { data } = await supabase.from('meal_plan')
      .select('*').eq('profile_id', profile.id).eq('week_start', week).maybeSingle()
    setMealPlan(data?.meals || [])
  }

  const searchSeason = async (forceQuery = null) => {
    setLoading(true)
    const seasonData = SEASON_INGREDIENTS[season]
    let q = forceQuery || query.trim()
    if (!q) q = seasonData.en[Math.floor(Math.random() * seasonData.en.length)]
    else q = await translateToEn(q)
    const results = await searchRecipes(q, filters)
    if (results.length > 0) {
      const groupSize = 3
      for (let i = 0; i < results.length; i += groupSize) {
        const group = results.slice(i, i + groupSize)
        const combined = group.map((r, j) => `[${j}] ${r.title}`).join(' | ')
        const translated = await translateChunk(combined)
        group.forEach((r, j) => {
          const match = translated.match(new RegExp(`\\[${j}\\]\\s*([^\\[|]+)`))
          if (match) r.titleFr = match[1].trim().replace(/\s*\|$/, '')
        })
        await new Promise(r => setTimeout(r, 200))
      }
    }
    setRecipes(results)
    setLoading(false)
  }

  const openRecipe = async (recipe) => {
    setLoading(true)
    const saved = savedRecipes.find(r => r.spoonacular_id === recipe.id || r.id === recipe.id || r.spoonacular_id === recipe.spoonacular_id)
    if (saved) { setSelectedRecipe({ ...saved, fromDB: true }); setLoading(false); return }
    const details = await getRecipeDetails(recipe.id || recipe.spoonacular_id)
    const translated = await translateRecipe(details)
    details.title = translated.title
    details.extendedIngredients = (details.extendedIngredients || []).map((ing, i) => ({ ...ing, original: translated.ingredients[i] || ing.original }))
    details.analyzedInstructions = [{ steps: (translated.steps || []).map((step, i) => ({ step, number: i + 1 })) }]
    setSelectedRecipe(details)
    setLoading(false)
  }

  const saveRecipe = async (recipe) => {
    if (savedRecipes.find(r => r.spoonacular_id === recipe.id)) return
    setSaving(true)
    const translated = await translateRecipe(recipe)
    const { data } = await supabase.from('recipes').insert({
      spoonacular_id: recipe.id,
      title: translated.title,
      image_url: recipe.image,
      ready_in_minutes: recipe.readyInMinutes,
      servings: recipe.servings,
      summary: recipe.summary?.replace(/<[^>]*>/g, '').slice(0, 300),
      ingredients: (recipe.extendedIngredients || []).map((ing, i) => ({ name: ing.name, amount: ing.amount, unit: ing.unit, original: translated.ingredients[i] || ing.original })),
      instructions: translated.steps,
      tags: [...(recipe.dishTypes || []), ...(recipe.cuisines || [])],
      vegetarian: recipe.vegetarian || false,
      season,
    }).select().single()
    setSavedRecipes(prev => [data, ...prev])
    setSaving(false)
  }

  const parseIngredient = (text) => {
    // Format: "2 poireaux" ou "200g farine" ou "2 gros poireaux"
    const match = text.match(/^([\d,.]+)\s*(g|kg|ml|l|cl|dl|oz|lb|tsp|tbsp|cup|pincée|pincee|gousse|tranche|botte|bouquet|branche|feuille|morceau)?\s+(.+)$/i)
    if (match) return {
      amount: parseFloat(match[1].replace(',', '.')),
      unit: match[2] || '',
      name: match[3].trim(),
      original: text
    }
    // Pas de quantité reconnue → tout dans name
    return { amount: null, unit: '', name: text, original: text }
  }

  const saveManualRecipe = async () => {
    if (!manualRecipe.title.trim()) return
    setSaving(true)
    const toSave = {
      spoonacular_id: null,
      title: manualRecipe.title.trim(),
      image_url: manualRecipe.image_url.trim() || null,
      ready_in_minutes: parseInt(manualRecipe.ready_in_minutes) || null,
      servings: parseInt(manualRecipe.servings) || null,
      summary: null,
      ingredients: manualRecipe.ingredients.filter(i => i.trim()).map(parseIngredient),
      instructions: manualRecipe.instructions.filter(s => s.trim()),
      tags: [], vegetarian: manualRecipe.vegetarian, season,
    }
    const { data } = await supabase.from('recipes').insert(toSave).select().single()
    setSavedRecipes(prev => [data, ...prev])
    setShowAddManual(false)
    setManualRecipe({ title: '', image_url: '', ready_in_minutes: '', servings: '', ingredients: [''], instructions: [''], vegetarian: false })
    setSaving(false)
  }

  const [editingRecipe, setEditingRecipe] = useState(null)

  const openEditRecipe = (recipe) => {
    setManualRecipe({
      title: recipe.title || '',
      image_url: recipe.image_url || '',
      ready_in_minutes: recipe.ready_in_minutes || '',
      servings: recipe.servings || '',
      ingredients: recipe.ingredients?.map(i => i.original || i.name) || [''],
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [''],
      vegetarian: recipe.vegetarian || false,
    })
    setEditingRecipe(recipe)
    setShowAddManual(true)
  }

  const updateRecipe = async () => {
    if (!manualRecipe.title.trim() || !editingRecipe) return
    setSaving(true)
    const updated = {
      title: manualRecipe.title.trim(),
      image_url: manualRecipe.image_url.trim() || null,
      ready_in_minutes: parseInt(manualRecipe.ready_in_minutes) || null,
      servings: parseInt(manualRecipe.servings) || null,
      ingredients: manualRecipe.ingredients.filter(i => i.trim()).map(i => {
        // Parser le texte pour extraire amount/unit/name
        const match = i.match(/^([\d,.]+)\s*([a-zA-Zéèàùêô]*)\s+(.+)$/)
        if (match) return { amount: parseFloat(match[1].replace(',', '.')), unit: match[2] || '', name: match[3], original: i }
        return { amount: null, unit: '', name: i, original: i }
      }),
      instructions: manualRecipe.instructions.filter(s => s.trim()),
      vegetarian: manualRecipe.vegetarian,
    }
    await supabase.from('recipes').update(updated).eq('id', editingRecipe.id)
    setSavedRecipes(prev => prev.map(r => r.id === editingRecipe.id ? { ...r, ...updated } : r))
    setShowAddManual(false)
    setEditingRecipe(null)
    setManualRecipe({ title: '', image_url: '', ready_in_minutes: '', servings: '', ingredients: [''], instructions: [''], vegetarian: false })
    setSaving(false)
  }
  const removeRecipe = async (id) => {
    await supabase.from('recipes').delete().eq('id', id)
    setSavedRecipes(prev => prev.filter(r => r.id !== id))
    setMealPlan(prev => prev.filter(m => m.recipe?.id !== id))
  }

  const addToMealPlan = (day, recipe) => {
    const updated = mealPlan.find(m => m.day === day)
      ? mealPlan.map(m => m.day === day ? { day, recipe } : m)
      : [...mealPlan, { day, recipe }]
    setMealPlan(updated)
    saveMealPlan(updated)
  }

  const removeFromPlan = (day) => {
    const updated = mealPlan.filter(m => m.day !== day)
    setMealPlan(updated)
    saveMealPlan(updated)
  }

  const saveMealPlan = async (meals) => {
    const week = getStartOfWeek()
    await supabase.from('meal_plan').upsert({ profile_id: profile.id, week_start: week, meals }, { onConflict: 'profile_id,week_start' })
  }

  const shoppingList = () => {
    const all = {}
    mealPlan.forEach(({ recipe }) => {
      ;(recipe.ingredients || []).forEach(ing => {
        // Utiliser original comme clé si disponible, sinon name
        const displayText = ing.original || ing.name || ''
        const key = (ing.name || displayText).toLowerCase().trim()
        if (!key) return
        if (all[key]) {
          if (ing.unit && all[key].unit === ing.unit && ing.amount) {
            all[key].amount = (parseFloat(all[key].amount) || 0) + parseFloat(ing.amount)
            all[key].original = all[key].amount + (ing.unit ? ' ' + ing.unit : '') + ' ' + ing.name
          }
          all[key].recipes.push(recipe.title)
        } else {
          all[key] = { ...ing, amount: parseFloat(ing.amount) || null, original: displayText, recipes: [recipe.title] }
        }
      })
    })
    return Object.values(all).map(ing => ({
      ...ing,
      display: ing.original || [
        ing.amount ? (Number.isInteger(ing.amount) ? ing.amount : ing.amount.toFixed(1)) : null,
        ing.unit || null,
        ing.name
      ].filter(Boolean).join(' ')
    }))
  }

  const isSaved = (id) => savedRecipes.some(r => r.spoonacular_id === id || r.id === id)

  // ─── DÉTAIL RECETTE ───────────────────────────────────────────────────────
  if (selectedRecipe) {
    const saved = selectedRecipe.fromDB || isSaved(selectedRecipe.id) || isSaved(selectedRecipe.spoonacular_id)
    const ingredients = selectedRecipe.ingredients || selectedRecipe.extendedIngredients?.map(i => ({ original: i.original, name: i.name })) || []
    const steps = Array.isArray(selectedRecipe.instructions)
      ? selectedRecipe.instructions
      : selectedRecipe.analyzedInstructions?.[0]?.steps?.map(s => s.step) || []

    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="relative">
          {selectedRecipe.image_url || selectedRecipe.image
            ? <img src={selectedRecipe.image_url || selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-56 object-cover" />
            : <div className="w-full h-56 bg-orange-100 flex items-center justify-center text-6xl">🍽️</div>}
          <button onClick={() => setSelectedRecipe(null)}
            className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          {!saved ? (
            <button onClick={() => saveRecipe(selectedRecipe)} disabled={saving}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-full text-xs font-semibold shadow active:scale-95 transition-transform disabled:opacity-50">
              <BookOpen size={14} /> {saving ? 'Traduction…' : 'Sauvegarder'}
            </button>
          ) : (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-full text-xs font-semibold shadow">
              <Check size={14} /> Dans le grimoire
            </div>
          )}
        </div>
        <div className="px-5 py-5 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-3">{selectedRecipe.title}</h1>
          <div className="flex gap-4 mb-4">
            {(selectedRecipe.ready_in_minutes || selectedRecipe.readyInMinutes) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock size={15} className="text-orange-400" />
                {selectedRecipe.ready_in_minutes || selectedRecipe.readyInMinutes} min
              </div>
            )}
            {selectedRecipe.servings && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users size={15} className="text-orange-400" />
                {selectedRecipe.servings} pers.
              </div>
            )}
            {selectedRecipe.vegetarian && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">🌿 Végétarien</span>}
          </div>

          {saved && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ajouter au planning</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DAYS_FR.map(day => {
                  const planned = mealPlan.find(m => m.day === day)
                  const isThis = planned?.recipe?.title === selectedRecipe.title
                  return (
                    <button key={day} onClick={() => isThis ? removeFromPlan(day) : addToMealPlan(day, selectedRecipe)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isThis ? 'bg-orange-500 text-white' : planned ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-orange-100'}`}>
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ingrédients</p>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {ing.original || ing.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Préparation</p>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'inspiration', label: '💡 Inspiration' },
            { id: 'grimoire', label: '📖 Grimoire' },
            { id: 'semaine', label: '📅 Semaine' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ─── INSPIRATION ──────────────────────────────────────────────── */}
        {tab === 'inspiration' && (
          <div className="px-4 py-4 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
                <Search size={15} className="text-gray-400" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchSeason()}
                  placeholder="Poireaux, risotto, thaï…"
                  className="flex-1 text-sm focus:outline-none" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border text-sm transition-all ${showFilters ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                ⚙️
              </button>
              <button onClick={() => searchSeason()} disabled={loading}
                className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform">
                {loading ? '…' : 'Go'}
              </button>
            </div>

            {showFilters && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 flex flex-wrap gap-2">
                <button onClick={() => setFilters(f => ({ ...f, vegetarian: !f.vegetarian }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filters.vegetarian ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  🌿 Végétarien
                </button>
                {[15, 30, 45].map(t => (
                  <button key={t} onClick={() => setFilters(f => ({ ...f, maxTime: f.maxTime === t ? null : t }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filters.maxTime === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    ⏱ {t} min
                  </button>
                ))}
              </div>
            )}

            {recipes.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">{SEASON_EMOJIS[season]}</div>
                <p className="text-gray-600 font-semibold mb-1">C'est {season} !</p>
                <p className="text-gray-400 text-sm mb-4">Des idées avec les produits de saison ?</p>
                <div className="flex flex-wrap gap-2 justify-center mb-5">
                  {SEASON_INGREDIENTS[season].fr.map((ing, i) => (
                    <button key={ing} onClick={() => { const e = SEASON_INGREDIENTS[season].en[i]; setQuery(e); searchSeason(e) }}
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium border border-orange-100 hover:bg-orange-100 transition-colors">
                      {ing}
                    </button>
                  ))}
                </div>
                <button onClick={() => searchSeason()}
                  className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold text-sm active:scale-95 transition-transform">
                  {SEASON_EMOJIS[season]} Surprise-moi !
                </button>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #fed7aa', borderTopColor: '#f97316' }} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {recipes.map(recipe => (
                <button key={recipe.id} onClick={() => openRecipe(recipe)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm text-left active:scale-95 transition-transform">
                  {recipe.image
                    ? <img src={recipe.image} alt={recipe.title} className="w-full h-28 object-cover" />
                    : <div className="w-full h-28 bg-orange-50 flex items-center justify-center text-3xl">🍽️</div>}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{recipe.titleFr || recipe.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {recipe.readyInMinutes && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock size={10} /> {recipe.readyInMinutes}m</span>}
                      {isSaved(recipe.id) && <span className="text-xs text-green-500">✓ Sauvé</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── GRIMOIRE ─────────────────────────────────────────────────── */}
        {tab === 'grimoire' && (
          <div className="px-4 py-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">{savedRecipes.length} recette{savedRecipes.length !== 1 ? 's' : ''} sauvegardée{savedRecipes.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowAddManual(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-full text-xs font-semibold active:scale-95 transition-transform">
                <Plus size={13} /> Ajouter
              </button>
            </div>

            {savedRecipes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📖</div>
                <p className="text-gray-500 font-medium mb-1">Le grimoire est vide</p>
                <p className="text-gray-400 text-sm">Explore les inspirations et sauvegarde des recettes !</p>
                <button onClick={() => setTab('inspiration')} className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold">→ Inspiration</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {savedRecipes.map(recipe => (
                  <div key={recipe.id} className="relative">
                    <button onClick={() => openRecipe(recipe)}
                      className="w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm text-left active:scale-95 transition-transform">
                      {recipe.image_url
                        ? <img src={recipe.image_url} alt={recipe.title} className="w-full h-28 object-cover" />
                        : <div className="w-full h-28 bg-orange-50 flex items-center justify-center text-3xl">🍽️</div>}
                      <div className="p-3">
                        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{recipe.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {recipe.ready_in_minutes && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock size={10} /> {recipe.ready_in_minutes}m</span>}
                          {recipe.vegetarian && <span className="text-xs text-green-500">🌿</span>}
                        </div>
                      </div>
                    </button>
                    <button onClick={e => { e.stopPropagation(); removeRecipe(recipe.id) }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow">
                      <X size={12} className="text-red-400" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); openEditRecipe(recipe) }}
                      className="absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow text-xs">
                      ✏️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Modal ajout manuel */}
            {showAddManual && (
              <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => { setShowAddManual(false); setEditingRecipe(null) }}>
                <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg">{editingRecipe ? '✏️ Modifier la recette' : '✍️ Nouvelle recette'}</h2>
                    <button onClick={() => { setShowAddManual(false); setEditingRecipe(null) }}><X size={20} className="text-gray-400" /></button>
                  </div>
                  <input value={manualRecipe.title} onChange={e => setManualRecipe(p => ({ ...p, title: e.target.value }))}
                    placeholder="Nom de la recette *"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm mb-3" />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input value={manualRecipe.ready_in_minutes} onChange={e => setManualRecipe(p => ({ ...p, ready_in_minutes: e.target.value }))}
                      placeholder="⏱ Temps (min)" type="number"
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" />
                    <input value={manualRecipe.servings} onChange={e => setManualRecipe(p => ({ ...p, servings: e.target.value }))}
                      placeholder="👥 Personnes" type="number"
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" />
                  </div>
                  <input value={manualRecipe.image_url} onChange={e => setManualRecipe(p => ({ ...p, image_url: e.target.value }))}
                    placeholder="🖼️ URL de la photo (optionnel)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm mb-3" />
                  <button onClick={() => setManualRecipe(p => ({ ...p, vegetarian: !p.vegetarian }))}
                    className={`mb-4 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${manualRecipe.vegetarian ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    🌿 Végétarien
                  </button>

                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ingrédients</p>
                  <div className="space-y-2 mb-4">
                    {manualRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={ing} onChange={e => { const n = [...manualRecipe.ingredients]; n[i] = e.target.value; setManualRecipe(p => ({ ...p, ingredients: n })) }}
                          placeholder={`Ingrédient ${i + 1}`}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" />
                        {manualRecipe.ingredients.length > 1 && (
                          <button onClick={() => setManualRecipe(p => ({ ...p, ingredients: p.ingredients.filter((_, j) => j !== i) }))}
                            className="p-2 text-gray-300 hover:text-red-400"><X size={15} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setManualRecipe(p => ({ ...p, ingredients: [...p.ingredients, ''] }))}
                      className="text-orange-500 text-xs font-semibold flex items-center gap-1">
                      <Plus size={13} /> Ajouter un ingrédient
                    </button>
                  </div>

                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Étapes</p>
                  <div className="space-y-2 mb-6">
                    {manualRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">{i + 1}</div>
                        <textarea value={step} onChange={e => { const n = [...manualRecipe.instructions]; n[i] = e.target.value; setManualRecipe(p => ({ ...p, instructions: n })) }}
                          placeholder={`Étape ${i + 1}…`} rows={2}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm resize-none" />
                        {manualRecipe.instructions.length > 1 && (
                          <button onClick={() => setManualRecipe(p => ({ ...p, instructions: p.instructions.filter((_, j) => j !== i) }))}
                            className="p-2 text-gray-300 hover:text-red-400 self-start mt-1"><X size={15} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setManualRecipe(p => ({ ...p, instructions: [...p.instructions, ''] }))}
                      className="text-orange-500 text-xs font-semibold flex items-center gap-1">
                      <Plus size={13} /> Ajouter une étape
                    </button>
                  </div>

                  <button onClick={editingRecipe ? updateRecipe : saveManualRecipe} disabled={!manualRecipe.title.trim() || saving}
                    className="w-full py-4 bg-orange-500 text-white rounded-full font-semibold disabled:opacity-30 active:scale-95 transition-transform">
                    {saving ? 'Sauvegarde…' : editingRecipe ? '✏️ Modifier la recette' : '📖 Ajouter au grimoire'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SEMAINE ──────────────────────────────────────────────────── */}
        {tab === 'semaine' && (
          <div className="px-4 py-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">Planning de la semaine</p>
              {mealPlan.length > 0 && (
                <button onClick={() => setShowShoppingList(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-full text-xs font-semibold active:scale-95 transition-transform">
                  <ShoppingCart size={13} /> Liste de courses
                </button>
              )}
            </div>
            <div className="space-y-2">
              {DAYS_FR.map(day => {
                const planned = mealPlan.find(m => m.day === day)
                return (
                  <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {planned ? (
                      <button onClick={() => openRecipe(planned.recipe)}
                        className="w-full flex items-center gap-3 p-3 text-left active:scale-98 transition-transform">
                        <div className="w-8 text-xs font-bold text-orange-500">{day.slice(0, 3)}</div>
                        {planned.recipe.image_url || planned.recipe.image
                          ? <img src={planned.recipe.image_url || planned.recipe.image} alt={planned.recipe.title} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                          : <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🍽️</div>}
                        <p className="flex-1 text-sm font-medium text-gray-900 line-clamp-2">{planned.recipe.title}</p>
                        <button onClick={e => { e.stopPropagation(); removeFromPlan(day) }} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                          <X size={15} />
                        </button>
                      </button>
                    ) : (
                      <button onClick={() => setTab('grimoire')} className="w-full flex items-center gap-3 p-3 text-left opacity-50">
                        <div className="w-8 text-xs font-bold text-gray-400">{day.slice(0, 3)}</div>
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                          <Plus size={16} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-300">Ajouter une recette</p>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {mealPlan.length === 0 && (
              <div className="text-center py-8 mt-4">
                <p className="text-gray-400 text-sm">Ouvre une recette du grimoire et ajoute-la à un jour !</p>
                <button onClick={() => setTab('grimoire')} className="mt-3 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold">→ Grimoire</button>
              </div>
            )}

            {showShoppingList && (
              <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowShoppingList(false)}>
                <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">🛒 Liste de courses</h2>
                    <button onClick={() => setShowShoppingList(false)}><X size={20} className="text-gray-400" /></button>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{mealPlan.length} repas · {shoppingList().length} ingrédients</p>
                  <div className="space-y-2">
                    {shoppingList().map((ing, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
                        <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                        <p className="flex-1 text-sm text-gray-800">{ing.display || ing.original || ing.name}</p>
                        <p className="text-xs text-gray-400">{ing.recipes.length > 1 ? `${ing.recipes.length} recettes` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}