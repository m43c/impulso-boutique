<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { isDark, toggleTheme } from '@/composables/useTheme'
import { useMediaQuery } from '@vueuse/core'
import { Bell, Moon, ScanQrCode, Sun } from '@lucide/vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const alertsStore = useAlertsStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

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
      <!-- Desktop view -->
      <header class="flex h-14 shrink-0 items-center justify-between gap-2 px-6 md:gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger class="-ml-1 shrink-0" />
          <div class="bg-border mr-1.5 hidden h-4 w-px shrink-0 md:block" />
          <!-- Breadcrumbs -->
          <Breadcrumb class="hidden min-w-0 flex-1 md:block">
            <BreadcrumbList class="flex-nowrap">
              <template v-if="route.name !== 'home'">
                <BreadcrumbItem class="shrink-0">
                  <BreadcrumbLink as-child>
                    <RouterLink to="/home">Inicio</RouterLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator class="shrink-0" />
              </template>
              <template v-if="route.meta.breadcrumb?.length">
                <template v-for="(item, index) in route.meta.breadcrumb" :key="index">
                  <BreadcrumbItem class="shrink-0">
                    <BreadcrumbLink as-child>
                      <RouterLink :to="item.to">{{ item.title }}</RouterLink>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator class="shrink-0" />
                </template>
              </template>
              <BreadcrumbItem class="min-w-0">
                <BreadcrumbPage class="truncate">{{ route.meta.title }}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 class="min-w-0 flex-1 truncate text-base font-semibold md:hidden">
            {{ route.meta.title }}
          </h1>
        </div>
        <!-- Icons -->
        <div class="flex shrink-0 items-center gap-0 md:gap-1">
          <!-- Scan QR code -->
          <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full">
            <ScanQrCode class="size-5" />
          </Button>
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
              <div class="border-b p-2.5 font-medium">Alertas de Stock</div>
              <div
                v-if="alertsStore.lowStockCount === 0"
                class="text-muted-foreground p-4 text-center text-sm"
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
          <!-- Toggle theme -->
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 rounded-full"
            :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            @click="toggleTheme()"
          >
            <Sun v-if="isDark" class="size-5" />
            <Moon v-else class="size-5" />
          </Button>
        </div>
      </header>
      <!-- Main content -->
      <main class="flex min-h-0 flex-1 flex-col">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
