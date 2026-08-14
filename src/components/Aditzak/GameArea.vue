<script setup>
import { ref } from 'vue'
import GameAreaClassic from './GameAreaClassic.vue'
import GameAreaAllTimes from './GameAreaAllTimes.vue'

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
  },
  initialActiveTab: {
    type: String,
    default: 'allTimes'
  }
})

function onValidateAnswer(data) {
  return emit('validate-answer', data)
}

const activeTab = ref(props.initialActiveTab)

const emit = defineEmits(['answer-submitted', 'restart-game', 'validate-answer'])
</script>

<template>
  <div class="w-full max-w-md mx-auto game-card md:p-4 lg:p-8 space-y-6 sm:space-y-8">
    <!-- Tab Navigation -->
    <div class="flex items-center gap-3">
      <div class="segmented-control flex-1 min-w-0">
        <button
          class="segmented-control__option"
          :aria-pressed="activeTab === 'allTimes'"
          @click="activeTab = 'allTimes'"
        >
          Denbora guztiak
        </button>

        <button
          class="segmented-control__option"
          :aria-pressed="activeTab === 'classic'"
          @click="activeTab = 'classic'"
        >
          Aleatorioa
        </button>
      </div>

      <slot name="header-action" />
    </div>

    <!-- Game Components -->
    <GameAreaClassic
      v-if="activeTab === 'classic'"
      :game-state="gameState"
      :sistemas="sistemas"
      @answer-submitted="$emit('answer-submitted', $event)"
      @restart-game="$emit('restart-game')"
    />
    
    <GameAreaAllTimes
      v-else
      :game-state="gameState"
      :sistemas="sistemas"
      :tiempos="tiempos"
      @validate-answer="(data) => $emit('validate-answer', data)"
      @restart-game="$emit('restart-game')"
    />
  </div>
</template>
