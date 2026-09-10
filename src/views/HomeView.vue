<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  try {
    await authStore.logout()
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message)
  } finally {
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="text-foreground flex min-h-screen flex-col items-center justify-center gap-4">
    <h1 class="text-4xl font-bold">Impulso Boutique</h1>
    <Button :disabled="authStore.isLoading" @click="handleLogout">
      <Loader2 v-if="authStore.isLoading" class="animate-spin" />
      {{ authStore.isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión' }}
    </Button>
  </div>
</template>
