<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { CircleAlert, CheckCircle2 } from '@lucide/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const alertsStore = useAlertsStore()
const { can } = usePermissions()

const canViewLowStock = computed(() => can('dashboard:view-low-stock-alerts'))

onMounted(() => {
  if (canViewLowStock.value) {
    alertsStore.fetchLowStockAlerts()
  }
})

function goToLowStock() {
  router.push('/products?stock=low')
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-2 px-6">
    <div v-if="canViewLowStock" class="flex flex-col items-start gap-4">
      <!-- Skeleton -->
      <Card
        v-if="alertsStore.isLoading"
        class="border-border/50 w-full max-w-md gap-3 rounded-md p-0 shadow-sm lg:max-w-xs"
      >
        <CardHeader class="px-4 pt-4">
          <CardTitle class="flex items-center gap-2">
            <Skeleton class="h-5 w-5 rounded-full" />
            <Skeleton class="h-5 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 px-4 pt-2 pb-4">
          <div v-for="i in 3" :key="i" class="flex items-center justify-between">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-5 w-16 rounded-full" />
          </div>
          <Skeleton class="mx-auto h-4 w-1/3" />
          <Skeleton class="mt-2 h-6 w-full rounded-md" />
        </CardContent>
      </Card>
      <!-- Alerts -->
      <Card
        v-else-if="alertsStore.lowStockCount > 0"
        class="w-full max-w-md gap-3 rounded-md border-amber-500/20 p-0 shadow-sm lg:max-w-xs"
      >
        <CardHeader class="px-4 pt-4">
          <CardTitle class="flex items-center gap-2 text-amber-500">
            <CircleAlert class="h-4 w-4" />
            <span class="text-[13px]">
              Productos con stock bajo ({{ alertsStore.lowStockCount }})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 px-4 pb-4">
          <TooltipProvider :delay-duration="200">
            <div
              v-for="item in alertsStore.lowStockProducts.slice(0, 3)"
              :key="item.id"
              class="flex items-center justify-between text-sm"
            >
              <Tooltip>
                <TooltipTrigger as-child>
                  <span class="truncate pr-4 text-xs">
                    {{ item.product.name }}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ item.product.name }}</p>
                </TooltipContent>
              </Tooltip>
              <Badge
                variant="outline"
                class="shrink-0 text-[11px]"
                :class="
                  item.stock_available === 0
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                "
              >
                {{ item.stock_available }} / mín. {{ item.product.min_stock }}
              </Badge>
            </div>
          </TooltipProvider>
          <p
            v-if="alertsStore.lowStockCount > 3"
            class="text-muted-foreground pt-1 text-center text-xs"
          >
            Y {{ alertsStore.lowStockCount - 3 }} productos más...
          </p>
          <Button variant="secondary" size="sm" class="mt-2 w-full" @click="goToLowStock">
            <span class="text-[13px] lg:text-xs">Ver todos los productos</span>
          </Button>
        </CardContent>
      </Card>
      <Card v-else class="w-full max-w-md rounded-md p-0 shadow-sm lg:max-w-sm">
        <CardContent class="flex items-start gap-2 p-4">
          <CheckCircle2 class="h-5 w-5 lg:h-4 lg:w-4" />
          <p class="text-sm font-medium lg:text-xs">Todo el inventario está en niveles óptimos</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
