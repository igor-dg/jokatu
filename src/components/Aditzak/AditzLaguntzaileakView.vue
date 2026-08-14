<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Settings } from 'lucide-vue-next'
import HitanoSelector from './HitanoSelector.vue'
import GameArea from './GameArea.vue'
import GameOverlay from '@/components/Aditzak/GameOverlay.vue'
import SystemSelectors from '@/components/Aditzak/SystemSelectors.vue'
import TimeSelectors from '@/components/Aditzak/TimeSelectors.vue'
import aditzakJsonData from '@/data/aditzak.json'
import esaldiakJsonData from '@/data/esaldiak.json'
import MobileSettingsModal from './MobileSettingsModal.vue'
import {
  selectValidPhrase,
  composePhrase,
  conjugacionExists,
  obtenerConjugacion,
  obtenerSistemaData,
  SISTEMA_NAMES,
  TIEMPO_NAMES,
  getSistemaDisplayName,
  getTiempoDisplayName
} from '@/utils.js'

const showMobileSettings = ref(false)
const hitanoEnabled = ref(false)
const userAnswer = ref('') 
// const { setTheme } = useTheme()

// watch(hitanoEnabled, (newValue) => {
//   setTheme(newValue ? 'hitano' : 'default')
// }, { immediate: true })

const emit = defineEmits(['theme-change'])

watch(hitanoEnabled, (newValue) => {
  emit('theme-change', newValue ? 'hitano' : 'default')
})

const sistemas = ref([
  { id: 'nor', name: SISTEMA_NAMES['nor'], active: true },
  { id: 'nor-nori', name: SISTEMA_NAMES['nor-nori'], active: true },
  { id: 'nor-nork', name: SISTEMA_NAMES['nor-nork'], active: true },
  { id: 'nor-nori-nork', name: SISTEMA_NAMES['nor-nori-nork'], active: true }
])

const tiempos = ref([
  { id: 'orain', name: TIEMPO_NAMES['orain'], active: true },
  { id: 'lehen', name: TIEMPO_NAMES['lehen'], active: true },
  { id: 'bal_hip', name: TIEMPO_NAMES['bal_hip'], active: true },
  { id: 'ond_or', name: TIEMPO_NAMES['ond_or'], active: true },
  { id: 'ond_leh', name: TIEMPO_NAMES['ond_leh'], active: true },
  { id: 'ahal_or', name: TIEMPO_NAMES['ahal_or'], active: true },
  { id: 'ahal_leh', name: TIEMPO_NAMES['ahal_leh'], active: true },
  { id: 'ahal_hip', name: TIEMPO_NAMES['ahal_hip'], active: true },
  { id: 'subj_or', name: TIEMPO_NAMES['subj_or'], active: true },
  { id: 'subj_leh', name: TIEMPO_NAMES['subj_leh'], active: true },
  { id: 'agintera', name: TIEMPO_NAMES['agintera'], active: true }
])

const gameState = ref({
  currentPhrase: '',
  selectedSistema: '',
  selectedTime: '',
  correctAnswer: '',
  intentos: 0,
  respuestasIncorrectas: [],
  showOverlay: false,
  overlayMessage: '',
  isCorrect: false,
  aukerakMessage: 'Hiru aukera dituzu',
  frasesUsadas: [],
  currentSubject: null,
  currentObject: null,
  hitanoEnabled: false,
  correctAnswers: {}
})

const aditzakData = ref(null)
const esaldiak = ref(null)

const sistemasActivos = computed(() => {
  return sistemas.value.filter(s => s.active).map(s => s.id)
})

const tiemposActivos = computed(() => {
  return tiempos.value.filter(t => t.active).map(t => t.id)
})

const gruposActivos = computed(() => {
  if (!aditzakData.value || sistemasActivos.value.length === 0) return []
  return aditzakData.value.filter(grupo => sistemasActivos.value.includes(grupo.sistema))
})

// Función para filtrar conjugaciones de hitano
function filterHitanoConjugations(conjugations) {
  if (hitanoEnabled.value) return conjugations

  // Filtrar las conjugaciones que contengan HI, HIK, o HIRI cuando hitano está desactivado
  return conjugations.filter(conj => {
    const hitanoPatterns = ['HI', 'HIK', 'HIRI']
    return !hitanoPatterns.some(pattern => 
      conj.selectedSubject?.includes(pattern) || 
      conj.selectedObject?.includes(pattern)
    )
  })
}

function handleHitanoChange(enabled) {
  hitanoEnabled.value = enabled
  // Reiniciar el juego para aplicar el filtro de hitano
  cargarJuegoAditzak()
}

// Nueva función para obtener todas las conjugaciones
function obtenerTodasLasConjugaciones(phraseData, grupoAleatorio) {
  const conjugaciones = {}
    
  tiemposActivos.value.forEach(tiempoId => {
    const sistemaData = { 
      [grupoAleatorio.sistema]: aditzakJsonData.sistema[grupoAleatorio.sistema]
    }
    
    const conjugacion = obtenerConjugacion(
      sistemaData,
      tiempoId,
      phraseData.selectedSubject,
      phraseData.selectedObject,
      phraseData.variables?.number || 'Sing'
    )
    
    if (conjugacion) {
      conjugaciones[tiempoId] = conjugacion
    }
  })
  
  return conjugaciones
}

function cargarJuegoAditzak(retryCount = 0) {
  try {
    // Validación inicial de sistemas y tiempos activos
    if (sistemasActivos.value.length === 0 || tiemposActivos.value.length === 0) {
      sistemas.value[0].active = true
      return
    }

    // Evitar bucles infinitos de retry
    if (retryCount > 10) {
      console.error('Demasiados intentos de cargar el juego')
      return
    }

    // Seleccionar sistema y tiempo aleatorios
    const grupoAleatorio = gruposActivos.value[Math.floor(Math.random() * gruposActivos.value.length)]
    const tiempoAleatorio = tiemposActivos.value[Math.floor(Math.random() * tiemposActivos.value.length)]

    // Obtener frase válida con sujeto/objeto
    const phraseData = selectValidPhrase(grupoAleatorio.sistema, tiempoAleatorio)
    if (!phraseData) {
      console.warn(`No se encontraron combinaciones válidas para ${grupoAleatorio.sistema}, intentando otro sistema`)
      return cargarJuegoAditzak(retryCount + 1)
    }

    // Verificar filtro de hitano
    if (!hitanoEnabled.value && phraseData) {
      const hitanoPatterns = ['HI', 'HIK', 'HIRI']
      if (hitanoPatterns.some(pattern => 
        phraseData.selectedSubject?.includes(pattern) || 
        phraseData.selectedObject?.includes(pattern)
      )) {
        return cargarJuegoAditzak(retryCount + 1)
      }
    }

    // Verificar que la conjugación existe
    const conjugacionExists = aditzakJsonData.sistema[grupoAleatorio.sistema]
    if (!conjugacionExists) {
      console.warn('Sistema no encontrado, intentando otra combinación')
      return cargarJuegoAditzak(retryCount + 1)
    }

    // Obtener conjugación correcta primero
    const conjugacionCorrecta = obtenerConjugacion(
      { [grupoAleatorio.sistema]: aditzakJsonData.sistema[grupoAleatorio.sistema] },
      tiempoAleatorio,
      phraseData.selectedSubject,
      phraseData.selectedObject,
      phraseData.variables?.number || 'Sing'
    )

    if (!conjugacionCorrecta) {
      console.warn('Conjugación no encontrada, intentando otra combinación')
      return cargarJuegoAditzak(retryCount + 1)
    }

    // Obtener todas las conjugaciones posibles
    const todasLasConjugaciones = obtenerTodasLasConjugaciones(phraseData, grupoAleatorio)

    // Componer la frase
    const composedPhrase = composePhrase(phraseData, grupoAleatorio.sistema, tiempoAleatorio)

    // Actualizar estado del juego
    gameState.value = {
      ...gameState.value,
      currentPhrase: composedPhrase,
      originalPhrase: phraseData.phrase,
      variables: phraseData.variables,
      selectedSistema: grupoAleatorio.sistema,
      selectedTime: tiempoAleatorio, // Añadido selectedTime
      correctAnswer: conjugacionCorrecta,
      correctAnswers: todasLasConjugaciones,
      intentos: 0,
      respuestasIncorrectas: [],
      currentSubject: phraseData.selectedSubject,
      currentObject: phraseData.selectedObject,
      showOverlay: false,
      isCorrect: false,
      aukerakMessage: 'Hiru aukera dituzu'
    }

  } catch (error) {
    console.error('Error al cargar el juego:', error)
    return cargarJuegoAditzak(retryCount + 1)
  }
}

// Nueva función para validar respuestas individuales
function handleValidateAnswer({ tiempo, answer }) {
  // Limpiar la respuesta y la respuesta correcta de paréntesis
  const cleanAnswer = answer.trim().replace(/\(|\)/g, '').toLowerCase()
  const correctAnswer = gameState.value.correctAnswers[tiempo]
  const cleanCorrect = correctAnswer?.replace(/\(|\)/g, '').toLowerCase()

  // Verificar si existe una respuesta correcta para este tiempo
  if (!correctAnswer) {
    console.warn(`No hay respuesta correcta para el tiempo ${tiempo}`)
    return null
  }

  // Comparar y devolver el resultado
  return cleanAnswer === cleanCorrect ? 'zuzena' : 'okerra'
}

function handleAnswer(answer) {
  const cleanAnswer = answer.replace(/\(|\)/g, '')
  const cleanCorrect = gameState.value.correctAnswer.replace(/\(|\)/g, '')

  if (cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase()) {
    handleCorrectAnswer()
  } else {
    handleIncorrectAnswer(answer)
  }
  userAnswer.value = '' // Clear input after submission
}

function handleCorrectAnswer() {
  const mensajesAcierto = ["Oso ondo!", "Primeran!", "Ederki!", "Bikain!", "Jarraitu honela!"]
  
  gameState.value = {
    ...gameState.value,
    isCorrect: true,
    showOverlay: true,
    overlayMessage: mensajesAcierto[Math.floor(Math.random() * mensajesAcierto.length)]
  }
}

function handleIncorrectAnswer(answer) {
  gameState.value.intentos++
  gameState.value.respuestasIncorrectas.push({
    numero: gameState.value.intentos,
    respuesta: answer
  })

  if (gameState.value.intentos === 1) {
    gameState.value.aukerakMessage = "Bi aukera dituzu"
  } else if (gameState.value.intentos === 2) {
    gameState.value.aukerakMessage = "Azken aukera!"
  } else {
    gameState.value = {
      ...gameState.value,
      isCorrect: false,
      showOverlay: true,
      overlayMessage: `Aukera zuzena: ${gameState.value.correctAnswer}`
    }
  }
}

function handleOverlayClose() {
  gameState.value.showOverlay = false
  cargarJuegoAditzak()
}

function handleSystemUpdate(newSistemas) {
  sistemas.value = newSistemas
  cargarJuegoAditzak()
}

function handleTimeUpdate(newTiempos) {
  tiempos.value = newTiempos
  cargarJuegoAditzak()
}

function handleRestartGame() {
  cargarJuegoAditzak()
}

onMounted(async () => {
  // Transformar aditzak
  aditzakData.value = Object.entries(aditzakJsonData.sistema).map(([sistema, conjugaciones]) => ({
    sistema,
    ...conjugaciones,
    [sistema]: conjugaciones
  }))

  // Transformar esaldiak
  esaldiak.value = Object.entries(esaldiakJsonData.sistema).map(([id, frases]) => ({
    id,
    frases
  }))

  cargarJuegoAditzak()
})


</script>

<template>
  <div class="h-full py-4">
    <div class="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Mobile Settings Modal -->
      <MobileSettingsModal v-model="showMobileSettings">
        <div class="space-y-1">
          <HitanoSelector v-model:hitanoEnabled="hitanoEnabled" />
          <SystemSelectors 
            v-model:sistemas="sistemas"
            @update:sistema="handleSystemUpdate"
          />
          <TimeSelectors
            v-model:tiempos="tiempos"
            @update:tiempo="handleTimeUpdate"
          />            
        </div>
      </MobileSettingsModal>

      <!-- Desktop Layout -->
      <div class="hidden md:grid md:grid-cols-[250px_1fr_250px] md:gap-8 items-start">
        <!-- Left Sidebar -->
        <div class="space-y-6">
          <div class="card p-4">
            <HitanoSelector v-model:hitanoEnabled="hitanoEnabled" />
          </div>
          <div class="card p-4">
            <SystemSelectors
              v-model:sistemas="sistemas"
              @update:sistema="handleSystemUpdate"
            />
          </div>
        </div>

        <!-- Main Game Area -->
        <GameArea
  :game-state="gameState"
  :sistemas="sistemas"
  :tiempos="tiempos"
  :initial-active-tab="'allTimes'"
  @answer-submitted="handleAnswer"
  @validate-answer="handleValidateAnswer"
  @restart-game="handleRestartGame"
/>

        <!-- Right Sidebar -->
        <div class="card p-4 h-fit">
          <TimeSelectors
            v-model:tiempos="tiempos"
            @update:tiempo="handleTimeUpdate"
          />
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="md:hidden">
        <GameArea
          :game-state="gameState"
          :sistemas="sistemas"
          :tiempos="tiempos"
          :initial-active-tab="'allTimes'"
          class="w-full max-w-md mx-auto"
          @answer-submitted="handleAnswer"
          @validate-answer="handleValidateAnswer"
          @restart-game="handleRestartGame"
        >
          <template #header-action>
            <button
              type="button"
              class="btn-secondary shrink-0 rounded-md p-2"
              aria-label="Ezarpenak"
              title="Ezarpenak"
              @click="showMobileSettings = true"
            >
              <Settings class="w-6 h-6" aria-hidden="true" />
            </button>
          </template>
        </GameArea>
      </div>

      <!-- Game Overlay -->
      <GameOverlay
        v-if="gameState.showOverlay"
        :message="gameState.overlayMessage"
        :is-correct="gameState.isCorrect"
        :sistema="gameState.selectedSistema"
        :tiempo="gameState.selectedTime"
        :phrase="gameState.currentPhrase"
        :correct-answer="gameState.correctAnswer"
        @close="handleOverlayClose"
        class="fade-in"
      />
    </div>
  </div>
</template>
