<script setup>
import { onMounted } from 'vue'
import AditzLaguntzaileakView from '@/components/Aditzak/AditzLaguntzaileakView.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

const emit = defineEmits(['theme-change'])

const onThemeChange = (theme) => {
  emit('theme-change', theme)
}

onMounted(() => {
  // Inicialización si es necesaria
})
</script>

<template>
  <div class="page-shell flex flex-col">
    <PageHeader title="Aditz laguntzaileak" />

    <!-- Contenido principal con el mismo estilo que Hiztegia -->
    <div class="flex-1">
        <AditzLaguntzaileakView @theme-change="onThemeChange" />
    </div>
  </div>
</template>
