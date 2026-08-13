import aditzakJsonData from '@/data/aditzak.json'
import esaldiakJsonData from '@/data/esaldiak.json'

// Cache data
const aditzakData = aditzakJsonData.sistema
const esaldiakData = esaldiakJsonData.sistema

// System and time mappings
export const SISTEMA_NAMES = {
  'nor': 'NOR',
  'nor-nori': 'NOR-NORI',
  'nor-nork': 'NOR-NORK',
  'nor-nori-nork': 'NOR-NORI-NORK'
}

export const TIEMPO_NAMES = {
  'orain': 'ORAINALDIA',
  'lehen': 'LEHENALDIA',
  'bal_hip': 'BALDINTZA HIPOTETIKOA',
  'ond_or': 'ONDORIOA ORAINALDIAN',
  'ond_leh': 'ONDORIOA LEHENALDIAN',
  'ahal_or': 'AHALERA ORAINALDIAN',
  'ahal_leh': 'AHALERA LEHENALDIAN',
  'ahal_hip': 'AHALERA HIPOTETIKOA',
  'subj_or': 'SUBJUNTIBOA ORAINALDIAN',
  'subj_leh': 'SUBJUNTIBOA LEHENALDIAN',
  'agintera': 'AGINTERA'
}

// Helper functions to get display names
export function getSistemaDisplayName(sistemaId) {
  return SISTEMA_NAMES[sistemaId] || sistemaId
}

export function getTiempoDisplayName(tiempoId) {
  return TIEMPO_NAMES[tiempoId] || tiempoId
}

// Base subject and object mappings
const baseSubjects = {
  'nor': ['NI', 'HI', 'HURA', 'GU', 'ZU', 'ZUEK', 'HAIEK'],
  'nor-nork': ['NIK', 'HIK', 'HARK', 'GUK', 'ZUK', 'ZUEK', 'HAIEK'],
  'nor-nori': ['NI', 'HI', 'HURA', 'GU', 'ZU', 'ZUEK', 'HAIEK'],
  'nor-nori-nork': ['NIK', 'HIK', 'HARK', 'GUK', 'ZUK', 'ZUEK', 'HAIEK']
}

const baseObjects = {
  'nor-nork': ['NI', 'HI', 'HURA', 'GU', 'ZU', 'ZUEK', 'HAIEK'],
  'nor-nori': ['NIRI', 'HIRI', 'HARI', 'GURI', 'ZURI', 'ZUEI', 'HAIEI'],
  'nor-nori-nork': ['NIRI', 'HIRI', 'HARI', 'GURI', 'ZURI', 'ZUEI', 'HAIEI']
}

// Validate subject-object combination
function isValidCombination(subject, object, phraseData) {
  // System-level restrictions
  if (subject === 'NIK' && object === 'NIRI') return false
  if (subject === 'ZUK' && object === 'ZURI') return false
  if (subject === 'ZU' && object === 'ZURI') return false
  if (subject === 'GUK' && object === 'GURI') return false

  // Phrase-specific restrictions
  if (phraseData?.variables?.forbidden_combinations) {
    return !phraseData.variables.forbidden_combinations.some(
      forbidden => 
        forbidden.subject === subject && 
        forbidden.object === object
    )
  }

  return true
}

function obtenerSistemaData(systemId) {
  return aditzakData[systemId]
}

// Get valid subjects for a system/phrase
function getValidSubjects(sistema, phraseData) {
  if (phraseData?.variables?.subject_fixed) {
    // Use subject_conjugation if available, otherwise try to map the subject
    return [phraseData.variables.subject_conjugation || 
            obtenerConjugacionSujeto(phraseData.variables.subject_fixed)]
  }
  return baseSubjects[sistema] || []
}

// Get valid objects for a system/phrase/subject
function getValidObjects(sistema, phraseData, subject) {
  if (phraseData?.variables?.object_fixed) {
    return [phraseData.variables.object_conjugation ||
            obtenerConjugacionObjeto(phraseData.variables.object_fixed)]
  }
  
  const objects = baseObjects[sistema] || []
  return objects.filter(obj => isValidCombination(subject, obj, phraseData))
}

function getRandomNumber() {
  return Math.random() < 0.5 ? 'Sing' : 'Plur'
}

// Select a valid phrase with guaranteed valid subject/object
function selectValidPhrase(sistema, tiempo) {
  const systemPhrases = esaldiakData[sistema] || []
  if (!systemPhrases.length) return null

  const shuffledPhrases = [...systemPhrases].sort(() => Math.random() - 0.5)

  for (const phrase of shuffledPhrases) {
    // If number is specified in phrase variables, use that, otherwise try both
    const numbersToTry = phrase.variables?.number ? 
      [phrase.variables.number] : 
      (sistema === 'nor-nori-nork' ? 
        [getRandomNumber(), getRandomNumber() === 'Sing' ? 'Plur' : 'Sing'] : 
        ['Sing'])

    for (const number of numbersToTry) {
      const validSubjects = getValidSubjects(sistema, phrase)
      const shuffledSubjects = [...validSubjects].sort(() => Math.random() - 0.5)

      for (const subject of shuffledSubjects) {
        const hasObject = phrase.phrase.includes('{object}') || !!phrase.variables?.object_fixed
        const validObjects = hasObject ?
          getValidObjects(sistema, phrase, subject) : [null]
        
        const shuffledObjects = [...validObjects].sort(() => Math.random() - 0.5)

        for (const object of shuffledObjects) {
          if (conjugacionExists(sistema, tiempo, subject, object, number)) {
            return {
              phrase: phrase.phrase,
              variables: { 
                ...phrase.variables,
                number // Always include number in returned variables
              },
              selectedSubject: subject,
              selectedObject: object
            }
          }
        }
      }
    }
  }

  return null
}

// Update conjugation exists to better handle number
function conjugacionExists(sistema, tiempo, sujeto, objeto, numero = 'Sing') {
  try {
    switch(sistema) {
      case 'nor-nori-nork':
        return !!aditzakData[sistema][numero]?.[sujeto]?.[objeto]?.[tiempo]?.[0]
      case 'nor-nori':
        return !!aditzakData[sistema][sujeto]?.[objeto]?.[tiempo]?.[0]
      case 'nor-nork':
        // For nor-nork, check if it's a plural object scenario
        if (objeto === 'HAIEK' || (numero === 'Plur' && !objeto)) {
          return !!aditzakData[sistema]['HAIEK']?.[sujeto]?.[tiempo]?.[0]
        }
        return !!aditzakData[sistema][objeto]?.[sujeto]?.[tiempo]?.[0]
      case 'nor':
        return !!aditzakData[sistema][sujeto]?.[tiempo]?.[0]
      default:
        return false
    }
  } catch {
    return false
  }
}

// Compose phrase with validated subject/object
// Helper functions for text case handling
function toSentenceCase(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function toLowerCase(text) {
  if (!text) return ''
  return text.toLowerCase()
}

// Compose phrase with validated subject/object and proper case
function composePhrase(phraseData, sistema, tiempo) {
  const { phrase, variables = {}, selectedSubject, selectedObject } = phraseData
  
  let composedPhrase = phrase
  
  // Replace subject placeholder with lowercase version
  const subject = variables.subject_fixed || selectedSubject
  composedPhrase = composedPhrase.replace('{subject}', toLowerCase(subject))
  
  // Replace object placeholder if present
  if (composedPhrase.includes('{object}')) {
    const object = variables.object_fixed || selectedObject
    composedPhrase = composedPhrase.replace('{object}', toLowerCase(object))
  }
  
  // Apply time-based rules
  composedPhrase = aplicarReglasFrase(composedPhrase, tiempo)
  
  // Convert final phrase to sentence case
  return toSentenceCase(composedPhrase)
}

// Apply time-based rules to phrase
function aplicarReglasFrase(phrase, time) {
  if (time === 'orain' || time === 'lehen') {
    return phrase.replace(/\(ko\)/g, '').replace(/\(go\)/g, '')
                 .replace(/\(tu\)/g, 'tu').replace(/\(du\)/g, 'du')
                 .replace(/\(i\)/g, 'i').replace(/\(u\)/g, 'u')
                 .replace(/\(ri\)/g, 'ri')
  }
  if (time === 'bal_hip' || time === 'ond_or' || time === 'ond_leh') {
    return phrase.replace(/\(ko\)/g, 'ko').replace(/\(go\)/g, 'go')
                 .replace(/\(tu\)/g, 'tu').replace(/\(du\)/g, 'du')
                 .replace(/\(i\)/g, 'i').replace(/\(u\)/g, 'u')
                 .replace(/\(ri\)/g, 'ri')
  }
  if (time === 'agintera' || time === 'ahal_or' || time === 'ahal_leh' || 
      time === 'ahal_hip' || time === 'subj_or' || time === 'subj_leh') {
    return phrase.replace(/\(ko\)/g, '').replace(/\(go\)/g, '')
                 .replace(/\(tu\)/g, '').replace(/\(du\)/g, '')
                 .replace(/\(i\)/g, '').replace(/\(ri\)/g, '')
                 .replace(/\(u\)/g, '')
  }
  return phrase
}

// Get conjugation for subject/object
function obtenerConjugacionSujeto(subject) {
  const mapeoSujetos = {
    'ni': 'NI', 'hi': 'HI', 'hura': 'HURA',
    'gu': 'GU', 'zu': 'ZU', 'zuek': 'ZUEK',
    'haiek': 'HAIEK', 'nik': 'NIK', 'hik': 'HIK',
    'hark': 'HARK', 'guk': 'GUK', 'zuk': 'ZUK'
  }
  return mapeoSujetos[subject.toLowerCase()] || subject
}

function obtenerConjugacionObjeto(object) {
  const mapeoObjetos = {
    'niri': 'NIRI', 'hiri': 'HIRI', 'hari': 'HARI',
    'guri': 'GURI', 'zuri': 'ZURI', 'zuei': 'ZUEI',
    'haiei': 'HAIEI', 'ni': 'NI', 'hi': 'HI',
    'hura': 'HURA', 'gu': 'GU', 'zu': 'ZU',
    'zuek': 'ZUEK', 'haiek': 'HAIEK'
  }
  return mapeoObjetos[object.toLowerCase()] || object
}

// Get conjugation with safe access
function obtenerConjugacion(grupo, tiempo, sujeto, objeto, numero = 'Sing') {
  try {
    // Verificar que tenemos todos los datos necesarios
    if (!grupo || !tiempo || !sujeto) {
      console.warn('Faltan datos necesarios para obtener conjugación')
      return null
    }

    if (grupo['nor-nori-nork']) {
      return grupo['nor-nori-nork'][numero]?.[sujeto]?.[objeto]?.[tiempo]?.[0] || null
    } 
    if (grupo['nor-nori']) {
      return grupo['nor-nori'][sujeto]?.[objeto]?.[tiempo]?.[0] || null
    }
    if (grupo['nor-nork']) {
      if (objeto === 'HAIEK' || (numero === 'Plur' && !objeto)) {
        return grupo['nor-nork']['HAIEK']?.[sujeto]?.[tiempo]?.[0] || null
      }
      return grupo['nor-nork'][objeto]?.[sujeto]?.[tiempo]?.[0] || null
    } 
    if (grupo['nor']) {
      return grupo['nor'][sujeto]?.[tiempo]?.[0] || null
    }
    return null
  } catch (error) {
    console.error('Error en obtenerConjugacion:', error)
    return null
  }
}

export {
  selectValidPhrase,
  toSentenceCase,
  toLowerCase,
  composePhrase,
  conjugacionExists,
  obtenerConjugacionSujeto,
  obtenerConjugacionObjeto,
  obtenerConjugacion,
  aplicarReglasFrase,
  obtenerSistemaData
}