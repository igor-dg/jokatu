<script setup>
import { Lightbulb } from 'lucide-vue-next'

const props = defineProps({
  tiempo: {
    type: Object,
    required: true
  },
  phrase: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  result: {
    type: String,
    default: null
  },
  interactive: {
    type: Boolean,
    default: true
  }
})

defineEmits(['update:modelValue', 'validate', 'hint'])
</script>

<template>
  <article class="aditz-card card" :aria-hidden="!interactive ? 'true' : undefined">
    <header class="flex items-center justify-between gap-2 mb-3">
      <span class="label-chip">{{ tiempo.name }}</span>
      <span
        v-if="result"
        :class="{
          'px-3 py-1 rounded-md text-sm font-medium': true,
          'bg-[var(--accent-success)] text-white': result === 'zuzena',
          'bg-[var(--accent-danger)] text-white': result === 'okerra'
        }"
      >
        {{ result }}
      </span>
    </header>

    <p class="aditz-card__phrase">{{ phrase }}</p>

    <form class="space-y-3" @submit.prevent="$emit('validate')">
      <div class="flex items-center gap-2">
        <input
          :id="tiempo.id"
          type="text"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          class="input text-lg"
          placeholder="Erantzuna..."
          autocomplete="off"
          autocapitalize="off"
          :tabindex="interactive ? 0 : -1"
        />
        <button
          type="button"
          class="p-2.5 rounded-md text-white shadow-sm transition-all duration-200 bg-[var(--accent-warning)] hover:bg-[var(--accent-warning-hover)] active:scale-95"
          :tabindex="interactive ? 0 : -1"
          aria-label="Megapista"
          @click="$emit('hint')"
        >
          <Lightbulb class="w-5 h-5" />
        </button>
      </div>
      <button
        type="submit"
        class="btn-primary rounded-md py-2.5 px-4 w-full"
        :tabindex="interactive ? 0 : -1"
      >
        Egiaztatu
      </button>
    </form>
  </article>
</template>

<style scoped>
.aditz-card {
  padding: 1.25rem;
  min-height: 100%;
}

.aditz-card__phrase {
  margin: 0 0 1rem;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}
</style>
