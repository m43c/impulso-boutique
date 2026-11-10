<script setup>
import 'vue-sonner/style.css'
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Toaster } from '@/components/ui/sonner'
import { isDark } from '@/composables/useTheme'

const isDesktop = useMediaQuery('(min-width: 768px)')

const toastOptions = computed(() =>
  isDesktop.value
    ? {
        style: { fontSize: '12px' },
        descriptionClass: 'text-[11px]',
      }
    : {},
)
</script>

<template>
  <RouterView />
  <Toaster
    :position="isDesktop ? 'top-right' : 'top-center'"
    :theme="isDark ? 'dark' : 'light'"
    rich-colors
    style="--width: 300px"
    :toast-options="toastOptions"
  />
</template>
