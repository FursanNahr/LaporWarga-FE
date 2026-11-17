import { ref } from 'vue'

const STORAGE_KEY = 'laporwarga_bookmarks'

function readBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Set reaktif global untuk ID laporan yang disimpan
const savedIds = ref(new Set(readBookmarks()))

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds.value]))
  } catch {
    // Abaikan jika storage penuh atau diblokir browser
  }
}

export function useBookmarks() {
  const isBookmarked = (id) => savedIds.value.has(Number(id))

  const toggleBookmark = (id) => {
    const numId = Number(id)
    if (savedIds.value.has(numId)) {
      savedIds.value.delete(numId)
    } else {
      savedIds.value.add(numId)
    }
    savedIds.value = new Set(savedIds.value)
    persist()
    return savedIds.value.has(numId)
  }

  return {
    savedIds,
    isBookmarked,
    toggleBookmark,
  }
}
