<script setup>
import 'vue-sonner/style.css'
import { useMediaQuery } from '@vueuse/core'
import { Toaster } from '@/components/ui/sonner'

const isDesktop = useMediaQuery('(min-width: 768px)')
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
