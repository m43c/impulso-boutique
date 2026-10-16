<script setup>
import { useRoute } from 'vue-router'
import { Bell, Sun } from '@lucide/vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/layout/AppSidebar.vue'
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
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex min-h-0 flex-col">
      <!-- Desktop view -->
      <header class="flex h-14 shrink-0 items-center justify-between gap-2 px-6 md:gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger class="-ml-1 shrink-0" />
          <!-- Separator -->
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
          <!-- Mobile view -->
          <h1 class="min-w-0 flex-1 truncate text-base font-semibold md:hidden">
            {{ route.meta.title }}
          </h1>
        </div>
        <!-- Icons -->
        <div class="flex shrink-0 items-center gap-0 md:gap-1">
          <Button variant="ghost" size="icon" class="relative h-8 w-8 rounded-full">
            <Bell class="size-5" />
            <Badge
              variant="default"
              class="absolute top-0.5 right-0.5 z-10 flex h-3.5 min-w-3.5 items-center justify-center rounded-full p-0 text-[9px] leading-none"
            >
              1
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full">
            <Sun class="size-5" />
          </Button>
        </div>
      </header>
      <main class="flex min-h-0 flex-1 flex-col">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
