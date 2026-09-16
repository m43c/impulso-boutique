<script setup>
import { onMounted } from 'vue'
import 'vue-sonner/style.css'
import { useAuthStore } from '@/stores/auth'
import { useMediaQuery } from '@vueuse/core'
import { Toaster } from '@/components/ui/sonner'

const authStore = useAuthStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <RouterView />
  <Toaster
    :position="isDesktop ? 'top-right' : 'top-center'"
    theme="dark"
    rich-colors
    style="--width: 300px"
  />
</template>
