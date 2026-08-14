<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RefreshCw, ChartLine, ChevronLeft, ChevronRight, Check, X } from 'lucide-vue-next'
import { getSistemaDisplayName, composePhrase } from '@/utils'
import HintOverlay from './HintOverlay.vue'
import AditzTiempoCard from './AditzTiempoCard.vue'
import norConjugations from '@/data/nor-conjugations.json'
import { useConjugations } from '@/composables/useConjugations'
import { useStatsService } from '@/composables/useStatsService'
import { useRouter } from 'vue-router'

const props = defineProps({
  gameState: {
    type: Object,
    required: true
  },
  sistemas: {
    type: Array,
    required: true,
  },
  tiempos: {
    type: Array,
    required: true
  }
})

const answers = ref({})
const results = ref({})
const megaPistas = ref({})
const showMegaPistaOverlay = ref(false)
const currentMegaPista = ref(null)
const currentIndex = ref(0)
const direction = ref('next')
const touchStartX = ref(null)

const activeTiempos = computed(() => props.tiempos.filter(t => t.active))
const finished = computed(() => activeTiempos.value.length > 0 && currentIndex.value >= activeTiempos.value.length)
const activeTiempo = computed(() => activeTiempos.value[currentIndex.value] || null)
const peekTiempos = computed(() => activeTiempos.value.slice(currentIndex.value + 1, currentIndex.value + 3))

// Initialize answers object with active times
watch(() => props.tiempos, (newTiempos) => {
  const newAnswers = {}
  newTiempos.forEach(tiempo => {
    if (tiempo.active) {
      newAnswers[tiempo.id] = ''
    }
  })
  answers.value = newAnswers
  megaPistas.value = {} // Reset megaPistas when times change
  currentIndex.value = 0
}, { immediate: true })

const { saveAditzakAttempt } = useStatsService()

async function handleValidate(tiempo) {
  if (!answers.value[tiempo]) {
    results.value[tiempo] = null
    return
  }

  const cleanAnswer = answers.value[tiempo].trim().replace(/\(|\)/g, '').toLowerCase()
  const correctAnswer = props.gameState.correctAnswers[tiempo]
  const cleanCorrect = correctAnswer?.replace(/\(|\)/g, '').toLowerCase()

  const isCorrect = cleanAnswer === cleanCorrect

  // Guardar estadística
  await saveAditzakAttempt(
    props.gameState.selectedSistema,
    tiempo,
    isCorrect
  )

  results.value = {
    ...results.value,
    [tiempo]: isCorrect ? 'zuzena' : 'okerra'
  }
}

function handleAnswerInput(tiempo, value) {
  answers.value[tiempo] = value
  if (results.value[tiempo]) {
    results.value = { ...results.value, [tiempo]: null }
  }
}

const { getMegaPistaContent, isTextualMegaPista, isTableMegaPista } = useConjugations()

const handleMegaPista = (tiempo) => {
  const sistema = props.gameState.selectedSistema

  const content = getMegaPistaContent(sistema, tiempo)

  switch(content.type) {
    case 'text':
  const norPersons = ['ni', 'hi', 'hura', 'gu', 'zu', 'zuek', 'haiek']
  const conjugations = norConjugations[tiempo]?.conjugations || []

  currentMegaPista.value = {
    isNorSystem: true,
    currentNor: props.gameState.currentSubject,
    tiempo: tiempo,
    conjugations: conjugations.map((conj, index) => ({
      person: norPersons[index],
      conjugation: conj
    }))
  }
  break;
    case 'table':
      // Aquí necesitamos diferenciar entre nor-nork y nor-nori
      if (sistema.toUpperCase() === 'NOR-NORK') {
        currentMegaPista.value = {
          isNorNorkSystem: true,
          currentNor: props.gameState.currentSubject,
          currentNork: props.gameState.currentObject,
          tiempo: tiempo,
          conjugations: content.content
        }
      } else if (sistema.toUpperCase() === 'NOR-NORI') {
        currentMegaPista.value = {
          isNorNoriSystem: true, // Nueva propiedad para nor-nori
          currentNor: props.gameState.currentSubject,
          currentNori: props.gameState.currentObject, // Asumiendo que currentObject contiene el nori
          tiempo: tiempo,
          conjugations: content.content
        }
      } else if (sistema.toUpperCase() === 'NOR-NORI-NORK') {
        currentMegaPista.value = {
          isNorNoriNorkSystem: true,
          currentNumber: props.gameState.currentNumber || 'Sing',
          currentNork: props.gameState.currentSubject,  // NORK es el sujeto
          currentNori: props.gameState.currentObject,   // NORI es el objeto indirecto
          tiempo: tiempo,
          conjugations: content.content
        }
      }

      break
    case 'image':
      currentMegaPista.value = {
        imagen: content.content
      }
      break
  }


  megaPistas.value[tiempo] = currentMegaPista.value
  showMegaPistaOverlay.value = true
}

function getCardPhrase(tiempo) {
  if (!props.gameState?.originalPhrase ||
      !props.gameState?.selectedSistema ||
      !props.gameState?.currentSubject) {
    return `${tiempo.name}...`
  }

  try {
    const phraseData = {
      phrase: props.gameState.originalPhrase,
      variables: props.gameState.variables || {},
      selectedSubject: props.gameState.currentSubject,
      selectedObject: props.gameState.currentObject
    }

    return composePhrase(
      phraseData,
      props.gameState.selectedSistema,
      tiempo.id
    )
  } catch (error) {
    console.warn('Error al componer la frase:', error)
    return `${tiempo.name}...`
  }
}

function goTo(index) {
  const clamped = Math.min(Math.max(index, 0), activeTiempos.value.length)
  direction.value = clamped >= currentIndex.value ? 'next' : 'prev'
  currentIndex.value = clamped
}

function nextCard() {
  goTo(currentIndex.value + 1)
}

function previousCard() {
  goTo(currentIndex.value - 1)
}

function peekStyle(i) {
  const depth = i + 1
  const side = i % 2 === 0 ? 1 : -1
  return {
    transform: `translate(${side * depth * 9}px, ${depth * 12}px) rotate(${side * depth * 2.5}deg) scale(${1 - depth * 0.05})`,
    zIndex: -depth
  }
}

function handleTouchStart(event) {
  touchStartX.value = event.changedTouches[0]?.clientX ?? null
}

function handleTouchEnd(event) {
  if (touchStartX.value === null) return
  const distance = (event.changedTouches[0]?.clientX ?? touchStartX.value) - touchStartX.value
  if (Math.abs(distance) > 55) {
    if (distance < 0) nextCard()
    if (distance > 0) previousCard()
  }
  touchStartX.value = null
}

function handleKeydown(event) {
  if (finished.value || showMegaPistaOverlay.value) return
  const activeTag = document.activeElement?.tagName
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return
  if (event.key === 'ArrowRight') nextCard()
  if (event.key === 'ArrowLeft') previousCard()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

function nextQuestion() {
  answers.value = Object.fromEntries(
    props.tiempos
      .filter(t => t.active)
      .map(t => [t.id, ''])
  )
  results.value = {}
  megaPistas.value = {}
  currentIndex.value = 0
  direction.value = 'next'
  emit('restart-game')
}

const emit = defineEmits(['validate-answer', 'restart-game'])

const router = useRouter()

const goToStats = () => {
  router.push({ name: 'estatistikak' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Game Info -->
    <div class="flex justify-center">
      <div class="space-y-1 text-center">
        <div class="text-sm text-[var(--text-secondary)]">Sistema:</div>
        <div
          v-if="gameState.selectedSistema"
          class="label-chip"
        >
          {{ getSistemaDisplayName(gameState.selectedSistema) }}
        </div>
      </div>
    </div>

    <template v-if="gameState.currentPhrase && activeTiempos.length">
      <div v-if="!finished" class="flex items-center justify-between">
        <button
          class="icon-button"
          :disabled="currentIndex === 0"
          aria-label="Aurreko denbora"
          @click="previousCard"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <span class="label-chip">{{ currentIndex + 1 }} / {{ activeTiempos.length }}</span>

        <button
          class="icon-button"
          aria-label="Hurrengo denbora"
          @click="nextCard"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <Transition name="panel-fade" mode="out-in">
        <!-- Card stack -->
        <div v-if="!finished" key="cards" class="pb-8">
          <div
            class="card-stack"
            @touchstart.passive="handleTouchStart"
            @touchend.passive="handleTouchEnd"
          >
            <div
              v-for="(tiempo, i) in peekTiempos"
              :key="tiempo.id"
              class="card-stack__peek"
              aria-hidden="true"
              :style="peekStyle(i)"
            >
              <AditzTiempoCard
                :tiempo="tiempo"
                :phrase="getCardPhrase(tiempo)"
                :model-value="answers[tiempo.id]"
                :result="results[tiempo.id]"
                :interactive="false"
              />
            </div>

            <Transition :name="`card-slide-${direction}`">
              <div :key="activeTiempo.id" class="card-stack__active">
                <AditzTiempoCard
                  :tiempo="activeTiempo"
                  :phrase="getCardPhrase(activeTiempo)"
                  :model-value="answers[activeTiempo.id]"
                  :result="results[activeTiempo.id]"
                  @update:model-value="(value) => handleAnswerInput(activeTiempo.id, value)"
                  @validate="handleValidate(activeTiempo.id)"
                  @hint="handleMegaPista(activeTiempo.id)"
                />
              </div>
            </Transition>
          </div>
        </div>

        <!-- Summary -->
        <div v-else key="summary" class="space-y-2">
          <div
            v-for="(tiempo, index) in activeTiempos"
            :key="tiempo.id"
            class="flex items-center justify-between gap-2 px-4 py-3 surface-soft cursor-pointer"
            @click="goTo(index)"
          >
            <span class="text-[var(--text-primary)] font-medium">{{ tiempo.name }}</span>
            <span
              :class="{
                'inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium': true,
                'bg-[var(--accent-success)] text-white': results[tiempo.id] === 'zuzena',
                'bg-[var(--accent-danger)] text-white': results[tiempo.id] === 'okerra',
                'bg-[var(--bg-soft)] text-[var(--text-secondary)]': !results[tiempo.id]
              }"
            >
              <Check v-if="results[tiempo.id] === 'zuzena'" class="w-4 h-4" />
              <X v-else-if="results[tiempo.id] === 'okerra'" class="w-4 h-4" />
              {{ results[tiempo.id] || 'erantzun gabe' }}
            </span>
          </div>
        </div>
      </Transition>
    </template>

    <!-- Global game actions -->
    <div class="flex gap-2">
      <button
        class="flex-1 btn-secondary rounded-md py-3 px-4 text-lg"
        title="Beste esaldi bat"
        @click="nextQuestion"
      >
        <RefreshCw class="w-5 h-5" />
        Beste esaldi bat
      </button>

      <button
        class="btn-secondary rounded-md py-3 px-4"
        title="Estatistikak"
        aria-label="Estatistikak"
        @click="goToStats"
      >
        <ChartLine class="w-5 h-5" aria-hidden="true" />
      </button>
    </div>

    <!-- MegaPista Overlay -->
    <HintOverlay
      v-if="currentMegaPista"
      :is-open="showMegaPistaOverlay"
      title="Megapista"
      :hint="currentMegaPista"
      @close="showMegaPistaOverlay = false"
    />
  </div>
</template>

<style scoped>
.card-stack {
  position: relative;
  isolation: isolate;
  flex: 1;
  min-width: 0;
}

.card-stack__peek {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.card-stack__peek :deep(.aditz-card) {
  box-shadow: var(--shadow-card-hover);
}

.card-stack__active {
  position: relative;
  z-index: 1;
}

.card-slide-next-enter-active,
.card-slide-next-leave-active,
.card-slide-prev-enter-active,
.card-slide-prev-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.card-slide-next-leave-active,
.card-slide-prev-leave-active {
  position: absolute;
  inset: 0;
}

.card-slide-next-enter-from {
  transform: translateX(24px);
  opacity: 0;
}

.card-slide-next-leave-to {
  transform: translateX(-120%) rotate(-6deg);
  opacity: 0;
}

.card-slide-prev-enter-from {
  transform: translateX(-24px);
  opacity: 0;
}

.card-slide-prev-leave-to {
  transform: translateX(120%) rotate(6deg);
  opacity: 0;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
</style>
