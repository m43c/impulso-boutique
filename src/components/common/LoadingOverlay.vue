<script setup>
import { Spinner } from '@/components/ui/spinner'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: 'Procesando...',
  },
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="bg-background/60 fixed inset-0 z-999 flex flex-col items-center justify-center gap-2 backdrop-blur-xs"
    >
      <Spinner class="text-primary size-8" />
      <p v-if="text" class="text-muted-foreground text-xs font-medium">{{ text }}</p>
    </div>
  </Transition>
</template>
