<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

async function handleLogout() {
  try {
    await authStore.logout()
    usersStore.clear()
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message)
  } finally {
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="text-foreground flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
    <h1 class="text-4xl font-bold">Impulso Boutique</h1>
    <Button :disabled="authStore.isLoading" @click="handleLogout">
      <Loader2 v-if="authStore.isLoading" class="animate-spin" />
      {{ authStore.isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión' }}
    </Button>
  </div>
</template>
