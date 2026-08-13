import hiztegiaData from '@/data/hiztegia.json'
import lexikoData from '@/data/lexiko.json'
import dailySequence from '@/data/hitzak/dailySequence.json'
import { loadValidWordSet } from '@/services/wordValidation'

const WORD_PATTERN = /^[A-ZÑ]+$/

export const DIFFICULTIES = [
  { id: 'erraza', label: 'Erraza', min: 2, max: 4 },
  { id: 'arrunta', label: 'Arrunta', min: 5, max: 5 },
  { id: 'zaila', label: 'Zaila', min: 6, max: 13 }
]

export const DEFAULT_DIFFICULTY = 'arrunta'

function normalize(word) {
  return word.trim().toUpperCase()
}

function collectCandidatesByLength() {
  const byLength = new Map()
  const add = (raw) => {
    const word = normalize(raw)
    if (!WORD_PATTERN.test(word)) return
    const list = byLength.get(word.length) ?? []
    list.push(word)
    byLength.set(word.length, list)
  }

  hiztegiaData.forEach(add)
  lexikoData.forEach(group => group.grupo.forEach(add))
  dailySequence.forEach(add)

  return byLength
}

const candidatesByLength = collectCandidatesByLength()
const poolCache = new Map()

// Zailtasun-maila bakoitzeko hitz-zerrenda eraikitzen du (hiztegia.json,
// lexiko.json eta eguneroko erronkaren hitz-zerrenda bateratuz), eta
// balioztatze-hiztegian (valid-N.txt) dauden hitzak soilik onartzen ditu:
// bestela jokalariak erantzun zuzena idatzi arren "ez da existitzen"
// jasoko luke.
export async function getWordPool(difficultyId) {
  if (poolCache.has(difficultyId)) return poolCache.get(difficultyId)

  const range = DIFFICULTIES.find(level => level.id === difficultyId)
  if (!range) return []

  const promise = (async () => {
    const words = new Set()
    for (let length = range.min; length <= range.max; length++) {
      const candidates = candidatesByLength.get(length)
      if (!candidates || candidates.length === 0) continue
      const validSet = await loadValidWordSet(length)
      candidates.forEach(word => {
        if (validSet.has(word)) words.add(word)
      })
    }
    return Array.from(words)
  })()

  poolCache.set(difficultyId, promise)
  return promise
}
