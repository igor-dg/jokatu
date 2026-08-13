<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import HiztegleDefinition from '@/components/Hiztegle/HiztegleDefinition.vue'
import KeyboardInput from '@/components/Hiztegle/KeyboardInput.vue'
import { RefreshCw, Languages, BookOpen } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import { isValidHiztegleGuess } from '@/services/wordValidation'
import { useStatsService } from '@/composables/useStatsService'
import { getDailyWord, getDailyChallengeState, saveDailyChallengeResult } from '@/utils/dailyWord'
import { getWordPool, DIFFICULTIES, DEFAULT_DIFFICULTY } from '@/utils/hiztegleWordPool'

const DIFFICULTY_KEY = 'hiztegle_difficulty'
const DIFFICULTY_IDS = DIFFICULTIES.map(level => level.id)

function getInitialDifficulty() {
  const stored = localStorage.getItem(DIFFICULTY_KEY)
  return DIFFICULTY_IDS.includes(stored) ? stored : DEFAULT_DIFFICULTY
}

const route = useRoute()
const mode = computed(() => (route.meta.dailyMode ? 'daily' : 'free'))
const difficulty = ref(getInitialDifficulty())
const gameState = ref('initial')
const dailyResult = ref(null)
const currentWord = ref('')
const timeLeft = ref(5)
const attempts = ref([])
const currentAttempt = ref('')
const letterStates = ref({})
const statusMessages = ref('')
const isGameOver = ref(false)
const showDefinition = ref(false)
const definitionTimeLeft = ref(5) // New ref for modal timer
const hints = ref(new Set())
const showTranslation = ref(false)
const translationTimeLeft = ref(5)
const activeContent = ref('definition') // 'definition' or 'translation'
const gameRecorded = ref(false)
const { saveHiztegleAttempt } = useStatsService()
let translationTimer = null
let timer = null
let definitionTimer = null // New timer for modal

// Gestión de palabras usadas
const USED_WORDS_KEY = 'hiztegle_used_words'
const MAX_WORDS_HISTORY = 50

function getUsedWords() {
  const storedWords = localStorage.getItem(USED_WORDS_KEY)
  return storedWords ? JSON.parse(storedWords) : []
}

function addToUsedWords(word) {
  let usedWords = getUsedWords()
  usedWords.push({
    word: word,
    date: new Date().toISOString()
  })
  
  if (usedWords.length > MAX_WORDS_HISTORY) {
    usedWords = usedWords.slice(-MAX_WORDS_HISTORY)
  }
  
  localStorage.setItem(USED_WORDS_KEY, JSON.stringify(usedWords))
}

async function selectRandomWord() {
  const pool = await getWordPool(difficulty.value)
  const usedWords = getUsedWords()
  const recentWords = new Set(usedWords.map(entry => entry.word))
  const availableWords = pool.filter(word => !recentWords.has(word))

  if (availableWords.length === 0) {
    localStorage.removeItem(USED_WORDS_KEY)
    currentWord.value = pool[Math.floor(Math.random() * pool.length)]
  } else {
    currentWord.value = availableWords[Math.floor(Math.random() * availableWords.length)]
  }

  addToUsedWords(currentWord.value)
}

function setDifficulty(id) {
  if (difficulty.value === id) return
  difficulty.value = id
  localStorage.setItem(DIFFICULTY_KEY, id)
  getWordPool(id) // aurrez kargatzen dugu, "Hasi jolasten" sakatzean itxaronik ez izateko
}

async function startGame() {
  if (mode.value === 'daily') {
    const existing = getDailyChallengeState()
    if (existing) {
      dailyResult.value = existing
      gameState.value = 'initial'
      return
    }
    currentWord.value = getDailyWord()
  } else {
    await selectRandomWord()
  }

  dailyResult.value = null
  attempts.value = []
  currentAttempt.value = ''
  letterStates.value = {}
  statusMessages.value = ''
  isGameOver.value = false
  showDefinition.value = false
  hints.value = new Set()
  definitionTimeLeft.value = 5 // Reset definition timer
  gameRecorded.value = false
  if (timer) clearInterval(timer)
  stopShakeLoop()

  if (mode.value === 'daily') {
    // Egunerokoan ez dugu definizioa hasieran erakusten, spoiler ez izateko;
    // botoiekin pista gisa erabil daiteke jokoan zehar.
    gameState.value = 'game'
  } else {
    gameState.value = 'definition'
    timeLeft.value = 5
  }
}

function startDefinitionTimer() {
  if (definitionTimer) clearInterval(definitionTimer)
  
  definitionTimeLeft.value = 5
  definitionTimer = setInterval(() => {
    if (definitionTimeLeft.value > 0) {
      definitionTimeLeft.value--
    } else {
      clearInterval(definitionTimer)
      showDefinition.value = false
    }
  }, 1000)
}

function resetDefinitionTimer() {
  if (definitionTimer) clearInterval(definitionTimer)
  definitionTimeLeft.value = 5
}

function toggleDefinition() {
  if (showDefinition.value && activeContent.value === 'definition') {
    showDefinition.value = false
  } else {
    showDefinition.value = true
    activeContent.value = 'definition'
    resetDefinitionTimer()
  }
}

function toggleTranslation() {
  if (showDefinition.value && activeContent.value === 'translation') {
    showDefinition.value = false
  } else {
    showDefinition.value = true
    activeContent.value = 'translation'
    resetDefinitionTimer()
  }
}

// Add watch to clean up definition timer when modal is closed
watch(showDefinition, (newValue) => {
  if (!newValue) {
    if (definitionTimer) {
      clearInterval(definitionTimer)
    }
  }
})

function startTimer() {
  if (timer) clearInterval(timer)
  
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer)
      if (gameState.value === 'definition') {
        gameState.value = 'game'
      }
    }
  }, 1000)
}

async function recordGame(correcto, attemptCount) {
  if (gameRecorded.value) return
  gameRecorded.value = true
  try {
    await saveHiztegleAttempt(currentWord.value, correcto, attemptCount)
    if (mode.value === 'daily') {
      dailyResult.value = saveDailyChallengeResult({
        correct: correcto,
        attempts: attemptCount,
        word: currentWord.value
      })
    }
  } catch (error) {
    console.error('Ezin izan da Hiztegle partida gorde:', error)
  }
}

async function skipWord() {
  await recordGame(false, attempts.value.length)
  statusMessages.value = `Hitza ${currentWord.value} zen.`
  setTimeout(() => {
    startGame()
  }, 2000)
}

const isCheckingWord = ref(false)

// Mezu iragankorrak (hitza ez da existitzen, etab.) toast gisa erakusten dira,
// zutabearen eta teklatuaren artean lekurik ez dagoelako.
const gameToastMessage = computed(() => {
  if (isCheckingWord.value) return 'Hitza egiaztatzen...'
  if (gameState.value === 'game' && statusMessages.value) return statusMessages.value
  return ''
})

const TOAST_DURATION = 2200
let toastTimer = null

watch(gameToastMessage, (message) => {
  if (toastTimer) clearTimeout(toastTimer)
  if (message && !isCheckingWord.value) {
    toastTimer = setTimeout(() => {
      statusMessages.value = ''
    }, TOAST_DURATION)
  }
})

// Hitz baliogabearen ondoren, lerroa aldizka astintzen dugu letraren bat
// ezabatu arte, oraindik editagarri dagoela argi geratzeko.
const shakeAttempt = ref(false)
const SHAKE_REPEAT_INTERVAL = 1500
let shakeLoopTimer = null

function pulseShake() {
  shakeAttempt.value = false
  // Bi rAF behar dira: nextTick soilarekin bi aldaketak marko berean
  // batu daitezke, eta arakatzaileak animazioa berrabiarazi ez.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      shakeAttempt.value = true
    })
  })
}

function startShakeLoop() {
  stopShakeLoop()
  pulseShake()
  shakeLoopTimer = setInterval(pulseShake, SHAKE_REPEAT_INTERVAL)
}

function stopShakeLoop() {
  if (shakeLoopTimer) {
    clearInterval(shakeLoopTimer)
    shakeLoopTimer = null
  }
  shakeAttempt.value = false
}

async function checkWordExists(word) {
  return isValidHiztegleGuess(word)
}

async function handleAttempt() {
  if (!currentAttempt.value || currentAttempt.value.length !== currentWord.value.length) {
    statusMessages.value = 'Hitza osatu behar duzu!'
    return
  }

  const attempt = currentAttempt.value.toUpperCase()
  
  if (isCheckingWord.value) return
  
  isCheckingWord.value = true

  try {
    const exists = await checkWordExists(attempt)
    
    if (!exists) {
      statusMessages.value = 'Hitz hori ez da existitzen!'
      startShakeLoop()
      return
    }
    
    statusMessages.value = ''
    
    const letterFrequency = {}
    currentWord.value.split('').forEach(letter => {
      letterFrequency[letter] = (letterFrequency[letter] || 0) + 1
    })

    const result = attempt.split('').map((letter, index) => {
      if (letter === currentWord.value[index]) {
        letterFrequency[letter]--
        return {
          letter,
          status: 'correct'
        }
      }
      return { letter, status: null }
    })

    result.forEach((res, index) => {
      if (res.status === null) {
        if (letterFrequency[res.letter] > 0) {
          res.status = 'present'
          letterFrequency[res.letter]--
        } else {
          res.status = 'absent'
        }
      }
    })

    result.forEach(({letter, status}) => {
      const currentStatus = letterStates.value[letter]
      if (
        !currentStatus || 
        (currentStatus === 'absent' && status !== 'absent') ||
        (currentStatus === 'present' && status === 'correct')
      ) {
        letterStates.value[letter] = status
      }
    })

    attempts.value.push(result)
    currentAttempt.value = ''

    if (attempt === currentWord.value) {
      gameState.value = 'complete'
      isGameOver.value = true
      statusMessages.value = '🎉 Zorionak! Asmatu duzu!'
      await recordGame(true, attempts.value.length)
    } else if (attempts.value.length >= 6) {
      gameState.value = 'complete'
      isGameOver.value = true
      statusMessages.value = `Game Over! Hitza ${currentWord.value} zen.`
      await recordGame(false, attempts.value.length)
    }
  } catch (error) {
    console.error('Error loading the local word list:', error)
    statusMessages.value = 'Ezin izan da hiztegia kargatu. Saiatu berriro.'
  } finally {
    isCheckingWord.value = false
  }
}

function handleKeyPress(key) {
  if (gameState.value !== 'game' || isGameOver.value) return
  
  if (key === '⌫') {
    currentAttempt.value = currentAttempt.value.slice(0, -1)
    statusMessages.value = ''
    stopShakeLoop()
  } else if (key === 'ENTER') {
    handleAttempt()
  } else if (currentAttempt.value.length < currentWord.value.length) {
    currentAttempt.value += key
  }
}

function revealHint() {
  // Encontrar posiciones correctas actuales basadas en los intentos
  const correctPositions = new Set()
  attempts.value.forEach(attempt => {
    attempt.forEach((letter, index) => {
      if (letter.status === 'correct') {
        correctPositions.add(index)
      }
    })
  })
  
  // Encontrar posiciones disponibles (no reveladas ni ya correctas)
  const availablePositions = []
  for (let i = 0; i < currentWord.value.length; i++) {
    if (!hints.value.has(i) && !correctPositions.has(i)) {
      availablePositions.push(i)
    }
  }
  
  // Si hay posiciones disponibles, revelar una aleatoria
  if (availablePositions.length > 0) {
    const randomIndex = availablePositions[Math.floor(Math.random() * availablePositions.length)]
    hints.value.add(randomIndex)
  }
}

onMounted(() => {
  gameState.value = 'initial'
  if (mode.value === 'daily') {
    dailyResult.value = getDailyChallengeState()
  } else {
    getWordPool(difficulty.value) // aurrez kargatzen dugu jokoa hasi aurretik
  }
  const usedWords = getUsedWords()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const filteredWords = usedWords.filter(entry => {
    const entryDate = new Date(entry.date)
    return entryDate > sevenDaysAgo
  })
  
  localStorage.setItem(USED_WORDS_KEY, JSON.stringify(filteredWords))
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (definitionTimer) clearInterval(definitionTimer)
  if (toastTimer) clearTimeout(toastTimer)
  stopShakeLoop()
})
</script>

<template>
  <div class="page-shell">
    <PageHeader
      :title="mode === 'daily' ? 'Eguneroko erronka' : 'Hiztegle'"
      :description="mode === 'daily' ? 'Egun honetan jokatzen duten guztiek hitz bera dute.' : 'Ikusi definizioa eta asmatu hitza!'"
    />

    <div class="max-w-2xl mx-auto mb-24">
      <!-- Estado inicial -->
      <div v-if="gameState === 'initial'" class="text-center">
        <template v-if="mode === 'daily' && dailyResult">
          <p class="daily-result-title">
            {{ dailyResult.correct ? '🎉 Gaurkoa gainditu duzu!' : `Hitza ${dailyResult.word} zen.` }}
          </p>
          <p class="daily-result-desc">
            {{ dailyResult.correct
              ? `${dailyResult.attempts} saiakeratan asmatu duzu.`
              : 'Ez duzu asmatu, baina bihar hitz berria izango duzu!' }}
          </p>
          <p class="daily-result-next">Bihar erronka berria izango duzu. Bitartean, jolastu nahi baduzu:</p>
          <router-link
            to="/hiztegle"
            class="btn-secondary py-3 px-7 text-lg"
          >
            Jokatu modu librean
          </router-link>
        </template>
        <template v-else>
          <div v-if="mode === 'free'" class="difficulty-toggle" role="tablist" aria-label="Zailtasun maila">
            <button
              v-for="level in DIFFICULTIES"
              :key="level.id"
              role="tab"
              :aria-selected="difficulty === level.id"
              class="difficulty-toggle__btn"
              :class="{ 'difficulty-toggle__btn--active': difficulty === level.id }"
              @click="setDifficulty(level.id)"
            >
              {{ level.label }}
            </button>
          </div>
          <button
            @click="startGame"
            class="btn-primary py-3 px-7 text-lg"
          >
            Hasi jolasten
          </button>
        </template>
      </div>

      <!-- Fase de definición inicial -->
      <div v-else-if="gameState === 'definition'"
     class="game-card md:p-4 lg:p-8">
  <HiztegleDefinition
    :word="currentWord"
    :time-left="timeLeft"
    content-type="definition"
    @content-ready="startTimer"
  />
</div>

      <!-- Fase de juego -->
      <div v-else-if="gameState === 'game' || gameState === 'complete'" 
           class="space-y-8">
        
        <!-- Definición flotante -->
        <Transition name="fade">
    <div v-if="showDefinition && gameState === 'game'"
         class="fixed inset-x-4 definition-popup sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50">
      <div class="card p-4 sm:p-6">
        <HiztegleDefinition
          :word="currentWord"
          :hide-timer="false"
          :time-left="definitionTimeLeft"
          :content-type="activeContent"
          @content-ready="startDefinitionTimer"
        />
      </div>
    </div>
  </Transition>

        <!-- Botones de acción -->
        <div class="flex justify-center gap-4">
          <button
      v-if="gameState === 'game'"
      @click="toggleDefinition"
      class="btn-secondary p-3 rounded-md"
      :title="showDefinition && activeContent === 'definition' ? 'Ezkutatu definizioa' : 'Ikusi definizioa'"
    >
      <BookOpen class="w-5 h-5" />
    </button>
    
    <button
      v-if="gameState === 'game'"
      @click="toggleTranslation"
      class="btn-secondary p-3 rounded-md flex items-center gap-1"
      :title="showDefinition && activeContent === 'translation' ? 'Ezkutatu itzulpena' : 'Ikusi itzulpena'"
    >
      <Languages class="w-5 h-5" />
      <span class="text-sm font-medium">eus>es</span>
    </button>
          
          <button
            v-if="gameState === 'game' && mode === 'free'"
            @click="skipWord"
            class="btn-secondary p-3 rounded-md"
            title="Aldatu hitza"
          >
            <RefreshCw class="w-5 h-5" />
          </button>

          <button
    v-if="gameState === 'game'"
    @click="revealHint"
    class="btn-secondary p-3 rounded-md"
    title="Erakutsi letra bat"
  >
    <!-- Puedes usar un icono de bombilla o similar -->
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
    </svg>
  </button>
        </div>

        <!-- Grid de intentos -->
        <div class="relative mb-16">
        <div class="grid gap-2"
     :class="{
       'max-w-[280px] mx-auto': currentWord.length <= 6,
       'w-full': currentWord.length > 6
     }">
  <!-- Intentos realizados -->
  <div v-for="(attempt, index) in attempts" 
       :key="index"
       class="grid gap-2"
       :style="{ gridTemplateColumns: `repeat(${currentWord.length}, minmax(0, 1fr))` }"
  >
    <div v-for="(letter, letterIndex) in attempt" 
         :key="letterIndex"
         class="w-full aspect-square flex items-center justify-center rounded-md text-white font-bold text-2xl
                transition-all duration-300 border-2"
         :class="{
           'state-correct': letter.status === 'correct',
           'state-present': letter.status === 'present',
           'state-absent': letter.status === 'absent'
         }"
    >
      {{ letter.letter }}
    </div>
  </div>

  <!-- Intento actual -->
  <div v-if="gameState === 'game'"
       class="grid gap-2"
       :class="{ shake: shakeAttempt }"
       :style="{ gridTemplateColumns: `repeat(${currentWord.length}, minmax(0, 1fr))` }"
  >
    <div v-for="i in currentWord.length" 
         :key="i"
         class="w-full aspect-square flex items-center justify-center rounded-md bg-[var(--bg-card)] border-2 border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-2xl"
    >
      {{ currentAttempt[i - 1] || '' }}
    </div>
  </div>

  <!-- Espacios vacíos restantes -->
  <div v-for="row in (6 - attempts.length - (gameState === 'game' ? 1 : 0))" 
       :key="`empty-${row}`"
       class="grid gap-2"
       :style="{ gridTemplateColumns: `repeat(${currentWord.length}, minmax(0, 1fr))` }"
  >
  <div v-for="col in currentWord.length" 
         :key="`empty-${row}-${col}`"
         class="w-full aspect-square flex items-center justify-center rounded-md border-2"
         :class="[
           hints.has(col - 1) ? 'state-hint' : 'bg-[var(--bg-card)] border-[var(--border-card)]'
         ]"
    >
      {{ hints.has(col - 1) ? currentWord[col - 1] : '' }}
    </div>
  </div>
</div>

        <!-- Egiaztapen-mezuen toast-a, zutabearen gainean -->
        <Transition name="toast">
          <div v-if="gameToastMessage"
               class="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 mx-auto w-max max-w-[85%]
                      px-5 py-3 rounded-lg shadow-lg text-center text-base sm:text-lg font-bold text-white
                      bg-[var(--accent-warning)]">
            {{ gameToastMessage }}
          </div>
        </Transition>
        </div>

        <!-- Mensaje de estado (jokoa amaitutakoan) -->
        <p v-if="gameState === 'complete' && statusMessages"
           class="text-center text-xl font-semibold"
           :class="{
             'text-[var(--accent-success)]': statusMessages.includes('Zorionak'),
             'text-[var(--accent-danger)]': statusMessages.includes('Game Over'),
             'text-[var(--text-primary)]': !statusMessages.includes('Zorionak') && !statusMessages.includes('Game Over')
           }"
        >
          {{ statusMessages }}
        </p>

        <!-- Botón de reinicio cuando el juego está completo -->
        <div v-if="gameState === 'complete'" class="text-center">
          <p v-if="mode === 'daily'" class="daily-result-next">Bihar erronka berria izango duzu!</p>
          <button
            @click="startGame"
            class="btn-primary py-3 px-6 text-lg"
          >
            {{ mode === 'daily' ? 'Ikusi emaitza' : 'Berriro jolastu' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Teclado virtual -->
    <KeyboardInput 
      v-if="gameState === 'game'"
      :letter-states="letterStates"
      @key="handleKeyPress"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.definition-popup {
  top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 1rem);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(0, -50%) scale(0.9);
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}

.shake {
  animation: shake 0.5s ease-in-out;
}

.difficulty-toggle {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.difficulty-toggle__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--border-card);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.difficulty-toggle__btn--active {
  border-color: transparent;
  background: #6C4CF1;
  color: white;
}

.daily-result-title {
  margin-bottom: 0.4rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.daily-result-desc {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.daily-result-next {
  margin-bottom: 0.75rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
