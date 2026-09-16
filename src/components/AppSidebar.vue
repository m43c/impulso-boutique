<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { EllipsisVertical, Home, LogOut, Store, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const items = [
  { title: 'Inicio', url: '/home', icon: Home },
  { title: 'Usuarios', url: '/users', icon: Users },
]

const isDesktop = useMediaQuery('(min-width: 768px)')

const nameParts = computed(() => authStore.profile?.full_name?.trim().split(/\s+/) ?? [])

const initials = computed(() => {
  const parts = nameParts.value

  if (!parts.length) {
    return '??'
  }

  const first = parts[0][0]
  const paternal = parts.length > 1 ? (parts.at(-2)?.[0] ?? parts.at(-1)[0]) : ''

  return (first + paternal).toUpperCase()
})

const displayName = computed(() => {
  const parts = nameParts.value

  if (!parts.length) {
    return 'Usuario'
  }

  if (parts.length <= 2) {
    return parts.join(' ')
  }

  return `${parts[0]} ${parts.at(-2)}`
})

async function handleLogout() {
  try {
    await authStore.logout()
    usersStore.clear()
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message)
  } finally {
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Store />
            <span class="font-semibold">Impulso Boutique</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
              <SidebarMenuButton as-child>
                <RouterLink :to="item.url">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <div class="flex items-center gap-2 p-2 px-2">
            <Avatar class="size-8 shrink-0">
              <AvatarFallback class="bg-sidebar-border text-sidebar-primary-foreground text-xs">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div class="flex flex-1 flex-col overflow-hidden">
              <span class="truncate text-sm font-medium">
                {{ displayName }}
              </span>
              <span class="text-muted-foreground truncate text-xs">
                {{ authStore.user?.email }}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  class="size-8 shrink-0 rounded-full"
                  aria-label="Opciones de cuenta"
                >
                  <EllipsisVertical />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent :side="isDesktop ? 'right' : 'top'" align="end" class="w-56">
                <DropdownMenuItem :disabled="authStore.isLoading" @click="handleLogout">
                  <LogOut />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
