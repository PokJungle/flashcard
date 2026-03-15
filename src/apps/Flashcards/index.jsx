import { useFlashcards } from './hooks/useFlashcards'
import { supabase } from '../../supabase'
import HomeScreen from './screens/HomeScreen'
import StudyScreen from './screens/StudyScreen'
import CuriositiesScreen from './screens/CuriositiesScreen'
import ManageScreen from './screens/ManageScreen'

export default function Flashcards({ profile }) {
  const fc = useFlashcards(profile)

  if (fc.screen === 'home') {
    return (
      <HomeScreen
        decks={fc.decks}
        startCuriosities={fc.startCuriosities}
        startDeck={fc.startDeck}
        openManage={fc.openManage}
        showUpload={fc.showUpload}
        setShowUpload={fc.setShowUpload}
        uploadStatus={fc.uploadStatus}
        handleUploadJSON={fc.handleUploadJSON}
      />
    )
  }

  if (fc.screen === 'study' && fc.activeDecks) {
    return (
      <StudyScreen
        activeDecks={fc.activeDecks}
        idx={fc.idx}
        flipped={fc.flipped} setFlipped={fc.setFlipped}
        fading={fc.fading}
        loadingNext={fc.loadingNext} setLoadingNext={fc.setLoadingNext}
        imgError={fc.imgError} setImgError={fc.setImgError}
        cardImages={fc.cardImages}
        showImgModal={fc.showImgModal} setShowImgModal={fc.setShowImgModal}
        imgUrlInput={fc.imgUrlInput} setImgUrlInput={fc.setImgUrlInput}
        imgModalCard={fc.imgModalCard}
        uploadingCard={fc.uploadingCard} setUploadingCard={fc.setUploadingCard}
        fileInputRef={fc.fileInputRef}
        setScreen={fc.setScreen}
        rateCard={fc.rateCard}
        goNext={fc.goNext}
        openImgModal={fc.openImgModal}
        saveImgUrl={fc.saveImgUrl}
        handleImageUpload={fc.handleImageUpload}
      />
    )
  }

  if (fc.screen === 'curiosities') {
    return (
      <CuriositiesScreen
        dailyCards={fc.dailyCards}
        idx={fc.idx} setIdx={fc.setIdx}
        flipped={fc.flipped} setFlipped={fc.setFlipped}
        fading={fc.fading} setFading={fc.setFading}
        showAddCuriosity={fc.showAddCuriosity} setShowAddCuriosity={fc.setShowAddCuriosity}
        newQ={fc.newQ} setNewQ={fc.setNewQ}
        newA={fc.newA} setNewA={fc.setNewA}
        addCuriosity={fc.addCuriosity}
        setScreen={fc.setScreen}
      />
    )
  }

  if (fc.screen === 'manage' && fc.manageDeck) {
    return (
      <ManageScreen
        manageDeck={fc.manageDeck}
        manageDeckCards={fc.manageDeckCards}
        cardImages={fc.cardImages}
        editingCard={fc.editingCard} setEditingCard={fc.setEditingCard}
        editCardFront={fc.editCardFront} setEditCardFront={fc.setEditCardFront}
        editCardBack={fc.editCardBack} setEditCardBack={fc.setEditCardBack}
        manageImgCard={fc.manageImgCard} setManageImgCard={fc.setManageImgCard}
        manageCardImages={fc.manageCardImages}
        imgUrlInput={fc.imgUrlInput} setImgUrlInput={fc.setImgUrlInput}
        uploadingCard={fc.uploadingCard} setUploadingCard={fc.setUploadingCard}
        setScreen={fc.setScreen}
        deleteCard={fc.deleteCard}
        saveEditCard={fc.saveEditCard}
        deleteDeck={fc.deleteDeck}
        openManageImages={fc.openManageImages}
        deleteCardImage={fc.deleteCardImage}
        handleImageUpload={fc.handleImageUpload}
        setCardImages={fc.setCardImages}
        supabase={supabase}
      />
    )
  }

  return null
}
