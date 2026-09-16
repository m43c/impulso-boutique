<script setup>
import { useMediaQuery } from '@vueuse/core'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'

const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex min-h-0 flex-col">
      <header class="flex px-5 pt-4 md:px-6">
        <SidebarTrigger />
      </header>
      <main class="flex min-h-0 flex-1 flex-col">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
