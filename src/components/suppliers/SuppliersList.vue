<script setup>
import { computed, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { CircleAlert, Loader2, Plus, RefreshCw, Search, Truck } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({
  suppliers: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits(['add-supplier', 'retry', 'refresh'])

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const search = ref('')

const hasSearch = computed(() => search.value.trim().length > 0)

const filteredSuppliers = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return props.suppliers
  }

  return props.suppliers.filter(
    (supplier) =>
      supplier.name?.toLowerCase().includes(term) || supplier.phone?.toLowerCase().includes(term),
  )
})

const emptyTitle = computed(() =>
  hasSearch.value ? 'No se encontraron proveedores' : 'No hay proveedores registrados',
)

const emptyDescription = computed(() =>
  hasSearch.value
    ? 'Intenta con otro nombre o número de teléfono.'
    : 'Agrega tu primer proveedor para empezar a gestionarlos.',
)
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div
      class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 pb-6 lg:h-[calc(100dvh-5rem)] lg:flex-none lg:overflow-hidden lg:pb-0"
    >
      <!-- Toolbar -->
      <div class="flex shrink-0 items-center justify-between gap-2">
        <!-- Search -->
        <div class="relative w-full">
          <Search class="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
          <Input
            v-model="search"
            placeholder="Buscar proveedor..."
            class="h-8 pl-8 text-[13px] lg:text-xs!"
          />
        </div>
        <!-- Refresh button -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="shrink-0 p-2!"
              :disabled="isLoading"
              aria-label="Actualizar lista"
              @click="emit('refresh')"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Actualizar lista</p>
          </TooltipContent>
        </Tooltip>
        <!-- Filters and sorting will be added together with the suppliers table -->
        <!-- Add supplier button -->
        <Button
          v-if="can('suppliers:create')"
          size="sm"
          class="hidden md:flex"
          :disabled="isLoading"
          @click="emit('add-supplier')"
        >
          <Plus class="h-4 w-4" />
          <span class="text-xs">Agregar proveedor</span>
        </Button>
      </div>
      <!-- Desktop view -->
      <div
        v-if="isDesktop"
        class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border"
      >
        <div class="relative isolate flex-1 overflow-auto">
          <!-- Skeleton -->
          <div v-if="isLoading" class="flex flex-col gap-3 p-4">
            <Skeleton v-for="row in 10" :key="`skeleton-${row}`" class="h-10 w-full" />
          </div>
          <!-- Error message -->
          <div
            v-else-if="error"
            class="flex h-full flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
              <CircleAlert />
            </div>
            <h3 class="text-sm font-semibold">{{ error }}</h3>
            <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">Inténtalo nuevamente</p>
            <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
              <Loader2 v-if="isLoading" class="animate-spin" />
              <span class="lg:text-xs">Reintentar</span>
            </Button>
          </div>
          <!-- Empty state -->
          <div
            v-else-if="!filteredSuppliers.length"
            class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <Truck class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">{{ emptyTitle }}</h3>
            <p class="text-muted-foreground max-w-xs text-xs">{{ emptyDescription }}</p>
          </div>
          <!-- TODO: suppliers table -->
        </div>
      </div>
      <!-- Mobile view -->
      <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
        <!-- Skeleton -->
        <template v-if="isLoading">
          <Card v-for="card in 5" :key="`skeleton-card-${card}`" class="py-0">
            <CardContent class="p-4">
              <Skeleton class="h-20 w-full" />
            </CardContent>
          </Card>
        </template>
        <!-- Error message -->
        <div
          v-else-if="error"
          class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        >
          <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
            <CircleAlert />
          </div>
          <h3 class="text-sm font-semibold">{{ error }}</h3>
          <p class="text-muted-foreground mt-1 mb-4 max-w-xs text-xs">Inténtalo nuevamente</p>
          <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
            <Loader2 v-if="isLoading" class="animate-spin" />
            <span class="text-xs">Reintentar</span>
          </Button>
        </div>
        <!-- Empty state -->
        <div
          v-else-if="!filteredSuppliers.length"
          class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        >
          <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
            <Truck class="h-9 w-9" />
          </div>
          <h3 class="text-sm font-semibold">{{ emptyTitle }}</h3>
          <p class="text-muted-foreground max-w-xs text-xs">{{ emptyDescription }}</p>
        </div>
        <!-- TODO: suppliers cards -->
      </div>
    </div>
  </TooltipProvider>
</template>
