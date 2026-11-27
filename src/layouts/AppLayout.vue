<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { Bell, CircleAlert, Moon, ScanQrCode, Sun, Undo2 } from '@lucide/vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import QrScannerModal from '@/components/scan/QrScannerModal.vue'
import { useAlertsStore } from '@/stores/alerts'
import { isDark, toggleTheme } from '@/composables/useTheme'
import { useBreadcrumbs } from '@/composables/useBreadcrumbs'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const router = useRouter()

const isDesktop = useMediaQuery('(min-width: 768px)')
const alertsStore = useAlertsStore()
const { breadcrumbs } = useBreadcrumbs()
const { can } = usePermissions()

const isScannerOpen = ref(false)
const isAlertsOpen = ref(false)

const canViewLowStockAlerts = computed(() => can('dashboard:view-low-stock-alerts'))
const canViewReturnedAlerts = computed(() => can('returns:review'))
const canViewAlerts = computed(() => canViewLowStockAlerts.value || canViewReturnedAlerts.value)

const alertsBadgeLabel = computed(() =>
  alertsStore.alertsTotal > 99 ? '99+' : String(alertsStore.alertsTotal),
)

const hasLowStockAlerts = computed(
  () => canViewLowStockAlerts.value && alertsStore.lowStockCount > 0,
)
const hasReturnedAlerts = computed(
  () => canViewReturnedAlerts.value && (alertsStore.returnedCount ?? 0) > 0,
)

const isReturnedCountUnknown = computed(
  () => canViewReturnedAlerts.value && alertsStore.returnedCount === null,
)

const isLoadingAlerts = computed(
  () =>
    (canViewLowStockAlerts.value && alertsStore.isLoading) ||
    (isReturnedCountUnknown.value && alertsStore.isLoadingReturned),
)

const lowStockLabel = computed(() => {
  const count = alertsStore.lowStockCount
  return `${count} ${count === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}`
})

const returnedUnitsLabel = computed(() => {
  const count = alertsStore.returnedCount ?? 0
  return `${count} ${count === 1 ? 'unidad espera revisión' : 'unidades esperan revisión'}`
})

function openScanner() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  isScannerOpen.value = true
}

function handleQrDetected(rawId) {
  const unitId = rawId.startsWith('/units/') ? rawId.split('/').pop() : rawId
  router.push({ name: 'unit-details', params: { id: unitId } })
}

let isSubscribedToAlerts = false

watch(
  [canViewLowStockAlerts, canViewReturnedAlerts],
  ([canViewLowStock, canViewReturned]) => {
    alertsStore.setReturnedAlertsEnabled(canViewReturned)

    if (canViewLowStock || canViewReturned) {
      if (canViewLowStock) {
        alertsStore.fetchLowStockAlerts()
      }

      if (canViewReturned) {
        alertsStore.fetchReturnedCount()
      }

      if (!isSubscribedToAlerts) {
        alertsStore.subscribeToStockChanges()
        isSubscribedToAlerts = true
      }
    } else if (isSubscribedToAlerts) {
      alertsStore.unsubscribeFromStockChanges()
      isSubscribedToAlerts = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (isSubscribedToAlerts) {
    alertsStore.unsubscribeFromStockChanges()
    isSubscribedToAlerts = false
  }
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex min-h-0 flex-col">
      <header class="flex h-14 shrink-0 items-center justify-between gap-2 px-6 md:gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger class="-ml-1 shrink-0" />
          <div class="bg-border mr-1.5 hidden h-4 w-px shrink-0 md:block" />
          <!-- Desktop view (Breadcrumbs) -->
          <Breadcrumb class="hidden min-w-0 flex-1 md:block">
            <BreadcrumbList class="flex-nowrap text-[13px]">
              <template v-if="route.name !== 'home'">
                <BreadcrumbItem class="shrink-0">
                  <BreadcrumbLink as-child>
                    <RouterLink to="/home">Inicio</RouterLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator class="shrink-0" />
              </template>
              <TooltipProvider :delay-duration="200">
                <template v-if="breadcrumbs?.length">
                  <template v-for="(item, index) in breadcrumbs" :key="index">
                    <BreadcrumbItem
                      :class="
                        item.current || item.truncate ? 'min-w-0 overflow-hidden' : 'shrink-0'
                      "
                    >
                      <!-- Current elemnt -->
                      <template v-if="item.current">
                        <Tooltip v-if="item.tooltip || item.truncate">
                          <TooltipTrigger as-child>
                            <BreadcrumbPage class="block truncate">{{ item.title }}</BreadcrumbPage>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{{ item.tooltip || item.title }}</p>
                          </TooltipContent>
                        </Tooltip>
                        <BreadcrumbPage v-else class="truncate">{{ item.title }}</BreadcrumbPage>
                      </template>
                      <!-- Elements with links -->
                      <template v-else>
                        <Tooltip v-if="item.truncate">
                          <TooltipTrigger as-child>
                            <BreadcrumbLink as-child>
                              <RouterLink
                                :to="item.to"
                                class="block max-w-37.5 truncate lg:max-w-62.5"
                              >
                                {{ item.title }}
                              </RouterLink>
                            </BreadcrumbLink>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{{ item.title }}</p>
                          </TooltipContent>
                        </Tooltip>
                        <BreadcrumbLink v-else as-child>
                          <RouterLink :to="item.to">{{ item.title }}</RouterLink>
                        </BreadcrumbLink>
                      </template>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator
                      v-if="index < breadcrumbs.length - 1 || !breadcrumbs.some((b) => b.current)"
                      class="shrink-0"
                    />
                  </template>
                </template>
              </TooltipProvider>
              <BreadcrumbItem
                v-if="!breadcrumbs?.some((b) => b.current)"
                class="min-w-0 overflow-hidden"
              >
                <BreadcrumbPage class="truncate">{{ route.meta.title }}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <!-- Mobile view (title) -->
          <h1 class="min-w-0 flex-1 truncate text-sm font-semibold md:hidden">
            {{ route.meta.title }}
          </h1>
        </div>
        <!-- Icons -->
        <TooltipProvider :delay-duration="200">
          <div class="flex shrink-0 items-center gap-0">
            <!-- Scan QR code -->
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 rounded-full"
                  aria-label="Escanear código QR"
                  @click="openScanner"
                >
                  <ScanQrCode class="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Escanear código QR</p>
              </TooltipContent>
            </Tooltip>
            <!-- Notifications -->
            <Popover v-if="canViewAlerts" v-model:open="isAlertsOpen">
              <PopoverTrigger as-child>
                <Button variant="ghost" size="icon" class="relative h-8 w-8 rounded-full">
                  <Bell class="size-4.5" />
                  <Badge
                    v-if="alertsStore.alertsTotal > 0"
                    class="absolute top-0.5 right-0.5 z-10 flex h-3.5 min-w-3.5 items-center justify-center rounded-full p-0 text-[10px] leading-none"
                  >
                    {{ alertsBadgeLabel }}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="p-0 text-xs" align="end">
                <div class="border-b p-2.5 font-medium lg:text-xs">Alertas</div>
                <!-- Alerts list -->
                <div v-if="hasLowStockAlerts || hasReturnedAlerts" class="flex flex-col divide-y">
                  <!-- Low stock -->
                  <RouterLink
                    v-if="hasLowStockAlerts"
                    to="/products?stock=low"
                    class="hover:bg-muted flex items-center justify-between gap-2 p-2 text-[11px] transition-colors"
                    @click="isAlertsOpen = false"
                  >
                    <span class="flex min-w-0 items-center gap-2">
                      <CircleAlert class="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span class="truncate">{{ lowStockLabel }}</span>
                    </span>
                    <Badge
                      variant="outline"
                      class="h-5 w-5 shrink-0 rounded-full border-amber-500/30 text-[11px] text-amber-500"
                    >
                      {{ alertsStore.lowStockCount }}
                    </Badge>
                  </RouterLink>
                  <!-- Returns/in review -->
                  <RouterLink
                    v-if="hasReturnedAlerts"
                    to="/sales?tab=returns"
                    class="hover:bg-muted flex items-center justify-between gap-2 p-2 text-[11px] transition-colors"
                    @click="isAlertsOpen = false"
                  >
                    <span class="flex min-w-0 items-center gap-2">
                      <Undo2 class="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span class="truncate">{{ returnedUnitsLabel }}</span>
                    </span>
                    <Badge
                      variant="outline"
                      class="h-5 w-5 shrink-0 rounded-full border-amber-500/30 text-[11px] text-amber-500"
                    >
                      {{ alertsStore.returnedCount }}
                    </Badge>
                  </RouterLink>
                </div>
                <!-- Loading -->
                <div
                  v-else-if="isLoadingAlerts"
                  class="text-muted-foreground p-4 text-center text-[11px]"
                >
                  Cargando alertas...
                </div>
                <!-- Returned count failed -->
                <div
                  v-else-if="isReturnedCountUnknown"
                  class="text-muted-foreground p-4 text-center text-[11px]"
                >
                  No se pudo cargar el conteo de devoluciones
                </div>
                <!-- Empty -->
                <div v-else class="text-muted-foreground p-4 text-center text-[11px]">
                  No hay alertas pendientes
                </div>
              </PopoverContent>
            </Popover>
            <!-- Theme -->
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 rounded-full"
                  :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                  @click="toggleTheme()"
                >
                  <Sun v-if="isDark" class="size-5" />
                  <Moon v-else class="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro' }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </header>
      <!-- Main content -->
      <main class="flex min-h-0 flex-1 flex-col">
        <RouterView />
      </main>
    </SidebarInset>
    <!-- QR scanner -->
    <QrScannerModal v-model:open="isScannerOpen" @detected="handleQrDetected" />
  </SidebarProvider>
</template>
