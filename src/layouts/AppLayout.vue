<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { Bell, Moon, ScanQrCode, Sun } from '@lucide/vue'
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

const route = useRoute()
const router = useRouter()

const isDesktop = useMediaQuery('(min-width: 768px)')
const alertsStore = useAlertsStore()
const { breadcrumbs } = useBreadcrumbs()

const isScannerOpen = ref(false)

function openScanner() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  isScannerOpen.value = true
}

function handleQrDetected(rawId) {
  const unitId = rawId.startsWith('/units/') ? rawId.split('/').pop() : rawId
  router.push({ name: 'unit-details', params: { unitId } })
}

onMounted(() => {
  alertsStore.fetchLowStockAlerts()
  alertsStore.subscribeToStockChanges()
})

onUnmounted(() => {
  alertsStore.unsubscribeFromStockChanges()
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
                      <!-- Elements witn links -->
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
          <!-- Mobile view -->
          <h1 class="min-w-0 flex-1 truncate text-sm font-semibold md:hidden">
            {{ route.meta.title }}
          </h1>
        </div>
        <!-- Icons -->
        <TooltipProvider :delay-duration="200">
          <div class="flex shrink-0 items-center gap-0 md:gap-1">
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
                  <ScanQrCode class="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Escanear código QR</p>
              </TooltipContent>
            </Tooltip>
            <!-- Notifications -->
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="ghost" size="icon" class="relative h-8 w-8 rounded-full">
                  <Bell class="size-5" />
                  <Badge
                    v-if="alertsStore.lowStockCount > 0"
                    class="absolute top-0.5 right-0.5 z-10 flex h-3.5 min-w-3.5 items-center justify-center rounded-full p-0 text-[10px] leading-none"
                  >
                    {{ alertsStore.lowStockCount }}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                class="w-[calc(100vw-3rem)] max-w-sm p-0 text-sm lg:w-80"
                :align="isDesktop ? 'end' : 'center'"
                :collision-padding="24"
              >
                <div class="border-b p-2.5 font-medium lg:text-[13px]">Alertas de Stock</div>
                <div
                  v-if="alertsStore.lowStockCount === 0"
                  class="text-muted-foreground p-4 text-center text-xs"
                >
                  Todo el inventario está en orden
                </div>
                <div v-else class="flex max-h-64 flex-col overflow-y-auto px-2 py-1">
                  <RouterLink
                    v-for="item in alertsStore.lowStockProducts"
                    :key="item.id"
                    to="/products?stock=low"
                    class="hover:bg-muted flex items-center justify-between rounded-md p-1 text-xs transition-colors"
                  >
                    <span class="truncate pr-2">{{ item.product.name }}</span>
                    <Badge
                      variant="outline"
                      class="shrink-0 text-[11px]"
                      :class="
                        item.stock_available === 0
                          ? 'border-rose-500/30 text-rose-500'
                          : 'border-amber-500/30 text-amber-500'
                      "
                    >
                      {{ item.stock_available }} / mín. {{ item.product.min_stock }}
                    </Badge>
                  </RouterLink>
                </div>
                <div v-if="alertsStore.lowStockCount > 0" class="border-t p-1.5">
                  <Button variant="ghost" size="sm" class="bg-muted w-full text-xs" as-child>
                    <RouterLink to="/products?stock=low">Ver todos los productos</RouterLink>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
