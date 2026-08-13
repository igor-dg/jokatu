const MIN_WORD_LENGTH = 2
const MAX_WORD_LENGTH = 13

// Cargadas como módulos (no por fetch): quedan empaquetadas con la app y se
// resuelven con el mismo mecanismo que ya carga el resto de las vistas, en
// vez de depender de una petición de red a un asset estático.
const wordListLoaders = import.meta.glob('../data/hitzak/valid-*.txt', { query: '?raw', import: 'default' })

let loadedLength = null
let loadedWords = null
let loadingLength = null
let loadingPromise = null

async function loadWords(length) {
  if (!Number.isInteger(length) || length < MIN_WORD_LENGTH || length > MAX_WORD_LENGTH) {
    return new Set()
  }

  if (loadedLength === length && loadedWords) {
    return loadedWords
  }

  if (loadingLength === length && loadingPromise) {
    return loadingPromise
  }

  const loadRaw = wordListLoaders[`../data/hitzak/valid-${length}.txt`]
  if (!loadRaw) {
    return new Set()
  }

  loadingLength = length
  loadingPromise = loadRaw()
    .then(text => {
      const words = new Set(text.split(/\r?\n/).filter(Boolean))
      loadedLength = length
      loadedWords = words
      return words
    })
    .finally(() => {
      if (loadingLength === length) {
        loadingLength = null
        loadingPromise = null
      }
    })

  return loadingPromise
}

export async function isValidHiztegleGuess(word) {
  const normalizedWord = word.trim().toUpperCase()
  const words = await loadWords(normalizedWord.length)
  return words.has(normalizedWord)
}

// Beste modulu batzuek (adib. zailtasun-mailako hitz-multzoak eraikitzeko)
// balioztatze-hiztegi berak berrerabil ditzaten, cachea partekatuz.
export async function loadValidWordSet(length) {
  return loadWords(length)
}
