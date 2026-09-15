<script setup>
import { useMediaQuery } from '@vueuse/core'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'

const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex px-5 pt-4 md:px-6">
        <SidebarTrigger />
      </header>
      <main>
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
