<script setup>
import { useAuthStore } from '@/stores/auth'
import { useMediaQuery } from '@vueuse/core'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/utils/date'
import { formatRole } from '@/utils/roles'

const authStore = useAuthStore()
const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 px-6">
    <Card class="w-full max-w-2xl">
      <!-- Skeleton -->
      <template v-if="authStore.isLoadingProfile">
        <CardHeader
          :class="[
            'flex gap-4',
            isDesktop ? 'flex-row items-center' : 'flex-col items-center text-center',
          ]"
        >
          <Skeleton class="size-14 rounded-full" />
          <div class="flex flex-col gap-2" :class="!isDesktop ? 'items-center' : ''">
            <Skeleton class="h-5 w-40" />
            <Skeleton class="h-4 w-52" />
          </div>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div v-for="row in 3" :key="row" class="flex items-center justify-between">
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-4 w-24" />
          </div>
        </CardContent>
      </template>
      <!-- Data -->
      <template v-else>
        <CardHeader
          :class="[
            'flex gap-4',
            isDesktop ? 'flex-row items-center' : 'flex-col items-center text-center',
          ]"
        >
          <Avatar class="size-14">
            <AvatarFallback
              class="bg-sidebar-border text-sidebar-primary-foreground rounded-full text-lg"
            >
              {{ authStore.initials }}
            </AvatarFallback>
          </Avatar>
          <div class="flex flex-col gap-1">
            <CardTitle class="text-lg">{{ authStore.profile?.full_name }}</CardTitle>
            <span class="text-muted-foreground text-sm">{{ authStore.user?.email }}</span>
          </div>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Rol</span>
            <span>{{ formatRole(authStore.profile?.role) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Estado</span>
            <Badge :variant="authStore.profile?.is_active ? 'success' : 'destructive'">
              {{ authStore.profile?.is_active ? 'Activo' : 'Inactivo' }}
            </Badge>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Miembro desde</span>
            <span>{{ formatDate(authStore.profile?.created_at) }}</span>
          </div>
        </CardContent>
      </template>
    </Card>
  </div>
</template>
