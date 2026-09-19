<script setup>
import { useRoute } from 'vue-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'

const route = useRoute()
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex min-h-0 flex-col">
      <header class="flex items-center px-4 py-4">
        <SidebarTrigger />
        <h1 class="pl-2 text-lg font-semibold">{{ route.meta.title }}</h1>
      </header>
      <main class="flex min-h-0 flex-1 flex-col">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
