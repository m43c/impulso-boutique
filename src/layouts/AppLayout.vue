<script setup>
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex p-2">
        <SidebarTrigger />
      </header>
      <main>
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
