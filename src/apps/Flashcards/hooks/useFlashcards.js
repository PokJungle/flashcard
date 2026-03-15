import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../supabase'
import { nextReview, compressImage, shuffle } from '../constants'

export function useFlashcards(profile) {
  const [screen, setScreen] = useState('home')
  const [decks, setDecks] = useState([])
  const [activeDecks, setActiveDecks] = useState(null)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [fading, setFading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [imgError, setImgError] = useState(false)

  const [cardImages, setCardImages] = useState({})
  const [currentImgIdx, setCurrentImgIdx] = useState({})
  const [uploadingCard, setUploadingCard] = useState(null)
  const [showImgModal, setShowImgModal] = useState(false)
  const [imgUrlInput, setImgUrlInput] = useState('')
  const [imgModalCard, setImgModalCard] = useState(null)
  const fileInputRef = useRef()

  const [dailyCards, setDailyCards] = useState([])
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [showAddCuriosity, setShowAddCuriosity] = useState(false)

  const [showUpload, setShowUpload] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)

  const [manageDeck, setManageDeck] = useState(null)
  const [manageDeckCards, setManageDeckCards] = useState([])
  const [editingCard, setEditingCard] = useState(null)
  const [editCardFront, setEditCardFront] = useState('')
  const [editCardBack, setEditCardBack] = useState('')
  const [manageImgCard, setManageImgCard] = useState(null)
  const [manageCardImages, setManageCardImages] = useState([])

  useEffect(() => { loadDecks() }, [])

  useEffect(() => {
    const k = (e) => {
      if (screen !== 'study') return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [screen, idx, activeDecks, fading])

  // ─── Loaders ───────────────────────────────────────────────────────────────

  const loadDecks = async () => {
    const { data } = await supabase.from('decks').select('*').order('created_at')
    setDecks(data || [])
  }

  const loadCardImages = async (cards) => {
    const ids = cards.map(c => c.id)
    const { data } = await supabase.from('card_images').select('*').in('card_id', ids)
    const map = {}, idxMap = {}
    for (const id of ids) {
      const imgs = (data || []).filter(i => i.card_id === id).map(i => i.url)
      map[id] = imgs
      if (imgs.length > 0) idxMap[id] = Math.floor(Math.random() * imgs.length)
    }
    setCardImages(map)
    setCurrentImgIdx(idxMap)
  }

  // ─── Study ─────────────────────────────────────────────────────────────────

  const startDeck = async (deck) => {
    setLoading(true)
    const { data: cards } = await supabase.from('cards').select('*').eq('deck_id', deck.id)
    const { data: progress } = await supabase.from('card_progress').select('*')
      .eq('profile_id', profile.id).in('card_id', cards.map(c => c.id))
    const progressMap = Object.fromEntries((progress || []).map(p => [p.card_id, p]))
    const now = new Date()
    const due = cards.filter(c => { const p = progressMap[c.id]; return !p || new Date(p.next_review) <= now })
    const toStudy = shuffle(due.length > 0 ? due : cards)
    await loadCardImages(toStudy)
    setActiveDecks({ deck, cards: toStudy, progressMap })
    setIdx(0); setFlipped(false)
    setScreen('study')
    setLoading(false)
  }

  const rateCard = async (rating) => {
    const card = activeDecks.cards[idx]
    const existing = activeDecks.progressMap[card.id]
    const { newLevel, next } = nextReview(existing?.level || 0, rating)
    if (existing) {
      await supabase.from('card_progress').update({
        level: newLevel, next_review: next.toISOString(), last_reviewed: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabase.from('card_progress').insert({
        profile_id: profile.id, card_id: card.id,
        level: newLevel, next_review: next.toISOString(), last_reviewed: new Date().toISOString()
      })
    }
    goNext()
  }

  const go = (dir) => {
    if (!activeDecks || fading) return
    const n = idx + dir
    if (n < 0 || n >= activeDecks.cards.length) return
    setFading(true)
    setTimeout(() => { setFlipped(false); setIdx(n); setFading(false) }, 180)
  }

  const goNext = () => {
    if (idx < activeDecks.cards.length - 1) {
      setLoadingNext(true)
      setFlipped(false)
      setTimeout(() => { setIdx(i => i + 1); setImgError(false) }, 400)
    } else {
      setFlipped(false)
      setTimeout(() => setScreen('home'), 300)
    }
  }

  // ─── Images ────────────────────────────────────────────────────────────────

  const openImgModal = (card) => { setImgModalCard(card); setImgUrlInput(''); setShowImgModal(true) }

  const saveImgUrl = async () => {
    if (!imgUrlInput.trim() || !imgModalCard) return
    try {
      await supabase.from('card_images').insert({ card_id: imgModalCard.id, url: imgUrlInput.trim() })
      setCardImages(prev => ({ ...prev, [imgModalCard.id]: [...(prev[imgModalCard.id] || []), imgUrlInput.trim()] }))
      setCurrentImgIdx(prev => ({ ...prev, [imgModalCard.id]: (cardImages[imgModalCard.id] || []).length }))
      setShowImgModal(false)
    } catch (err) { alert('Erreur : ' + err.message) }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !uploadingCard) return
    try {
      const blob = await compressImage(file)
      const path = `${uploadingCard}/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('card-images').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)
      await supabase.from('card_images').insert({ card_id: uploadingCard, url: publicUrl })
      setCardImages(prev => ({ ...prev, [uploadingCard]: [...(prev[uploadingCard] || []), publicUrl] }))
      setCurrentImgIdx(prev => ({ ...prev, [uploadingCard]: (cardImages[uploadingCard] || []).length }))
    } catch (err) { alert('Erreur upload : ' + err.message) }
    setUploadingCard(null)
    e.target.value = ''
  }

  // ─── Curiosités ────────────────────────────────────────────────────────────

  const startCuriosities = async () => {
    setLoading(true)
    const { data: curios } = await supabase.from('curiosities').select('*')
      .eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(20)
    const { data: randomCards } = await supabase.from('cards').select('*').limit(50)
    const mixed = [
      ...shuffle(curios || []).slice(0, 5).map(c => ({ front: c.question, back: c.answer, isCuriosity: true })),
      ...shuffle(randomCards || []).slice(0, 5).map(c => ({ front: c.front, back: c.back }))
    ].sort(() => Math.random() - 0.5)
    setDailyCards(mixed); setIdx(0); setFlipped(false)
    setScreen('curiosities')
    setLoading(false)
  }

  const addCuriosity = async () => {
    if (!newQ.trim() || !newA.trim()) return
    await supabase.from('curiosities').insert({ profile_id: profile.id, question: newQ, answer: newA })
    setNewQ(''); setNewA(''); setShowAddCuriosity(false)
  }

  // ─── Upload JSON ───────────────────────────────────────────────────────────

  const handleUploadJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadStatus('loading')
    try {
      const json = JSON.parse(await file.text())
      const { data: deck } = await supabase.from('decks').insert({
        name: json.name, theme: json.theme || 'autre', description: json.description || ''
      }).select().single()
      await supabase.from('cards').insert(
        json.cards.map(c => ({ deck_id: deck.id, front: c.front, back: c.back }))
      )
      await loadDecks()
      setUploadStatus('success')
      setTimeout(() => { setShowUpload(false); setUploadStatus(null) }, 2000)
    } catch { setUploadStatus('error') }
  }

  // ─── Manage ────────────────────────────────────────────────────────────────

  const openManage = async (deck) => {
    const { data } = await supabase.from('cards').select('*').eq('deck_id', deck.id)
    await loadCardImages(data || [])
    setManageDeckCards(data || [])
    setManageDeck(deck)
    setScreen('manage')
  }

  const deleteCard = async (cardId) => {
    await supabase.from('cards').delete().eq('id', cardId)
    setManageDeckCards(prev => prev.filter(c => c.id !== cardId))
  }

  const saveEditCard = async () => {
    if (!editingCard) return
    if (editingCard.id === null) {
      const { data } = await supabase.from('cards').insert({
        deck_id: manageDeck.id, front: editCardFront, back: editCardBack
      }).select().single()
      setManageDeckCards(prev => [...prev, data])
    } else {
      await supabase.from('cards').update({ front: editCardFront, back: editCardBack }).eq('id', editingCard.id)
      setManageDeckCards(prev => prev.map(c => c.id === editingCard.id
        ? { ...c, front: editCardFront, back: editCardBack } : c
      ))
    }
    setEditingCard(null)
  }

  const deleteDeck = async (deck) => {
    await supabase.from('decks').delete().eq('id', deck.id)
    setDecks(prev => prev.filter(d => d.id !== deck.id))
    setScreen('home')
  }

  const openManageImages = async (card) => {
    const { data } = await supabase.from('card_images').select('*').eq('card_id', card.id)
    setManageCardImages(data || [])
    setManageImgCard(card)
  }

  const deleteCardImage = async (img) => {
    if (img.url.includes('card-images')) {
      const path = img.url.split('card-images/')[1]
      await supabase.storage.from('card-images').remove([path])
    }
    await supabase.from('card_images').delete().eq('id', img.id)
    setManageCardImages(prev => prev.filter(i => i.id !== img.id))
    setCardImages(prev => ({
      ...prev,
      [img.card_id]: (prev[img.card_id] || []).filter(u => u !== img.url)
    }))
  }

  return {
    // state
    screen, setScreen,
    decks,
    activeDecks,
    idx, setIdx,
    flipped, setFlipped,
    fading, setFading,
    loading,
    loadingNext, setLoadingNext,
    imgError, setImgError,
    cardImages, setCardImages,
    currentImgIdx,
    uploadingCard, setUploadingCard,
    showImgModal, setShowImgModal,
    imgUrlInput, setImgUrlInput,
    imgModalCard,
    fileInputRef,
    dailyCards,
    newQ, setNewQ,
    newA, setNewA,
    showAddCuriosity, setShowAddCuriosity,
    showUpload, setShowUpload,
    uploadStatus,
    manageDeck,
    manageDeckCards,
    editingCard, setEditingCard,
    editCardFront, setEditCardFront,
    editCardBack, setEditCardBack,
    manageImgCard, setManageImgCard,
    manageCardImages, setManageCardImages,
    // actions
    startDeck,
    rateCard,
    go,
    goNext,
    openImgModal,
    saveImgUrl,
    handleImageUpload,
    startCuriosities,
    addCuriosity,
    handleUploadJSON,
    openManage,
    deleteCard,
    saveEditCard,
    deleteDeck,
    openManageImages,
    deleteCardImage,
  }
}
