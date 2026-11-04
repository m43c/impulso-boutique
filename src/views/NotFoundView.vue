<script setup>
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex min-h-svh w-full flex-col items-center justify-center p-6 text-center">
    <span class="text-primary text-5xl lg:text-7xl font-bold">404</span>
    <h1 class="text-lg lg:text-2xl font-semibold">Página no encontrada</h1>
    <p class="text-muted-foreground max-w-sm text-sm">
      La página que buscas no existe o fue movida
    </p>
    <Button as-child size="sm" class="mt-3 lg:text-xs">
      <RouterLink to="/home">Volver al inicio</RouterLink>
    </Button>
  </div>
</template>
