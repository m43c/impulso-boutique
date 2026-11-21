<script setup>
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6">
    <div class="flex items-center justify-between gap-2">
      <p class="text-muted-foreground lg:text-xs">Últimas 24 horas</p>
      <Button
        v-if="can('sales:create')"
        :size="isDesktop ? 'sm' : ''"
        class="lg:text-xs"
        @click="router.push({ name: 'sale-new' })"
      >
        <Plus class="size-4" />
        Nueva venta
      </Button>
    </div>
    <div
      class="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed text-center"
    >
      <p class="font-medium lg:text-sm">Ventas de las últimas 24 horas</p>
      <p class="text-muted-foreground max-w-sm text-xs">La lista de ventas se mostrará aquí.</p>
    </div>
  </div>
</template>
