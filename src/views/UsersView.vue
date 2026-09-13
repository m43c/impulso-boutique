<script setup>
import { onMounted, ref } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useMediaQuery } from '@vueuse/core'
import { UserPlus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import UserForm from '@/components/users/UserForm.vue'
import UsersList from '@/components/users/UsersList.vue'

const usersStore = useUsersStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

const isSheetOpen = ref(false)

onMounted(() => {
  usersStore.fetchUsers().catch((error) => {
    console.error('Error al cargar usuarios:', error)
  })
})

async function handleSubmit(formData) {
  try {
    const createdUser = await usersStore.createUser({
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      role: formData.role,
    })

    console.log('Usuario creado:', createdUser)
    usersStore.fetchUsers()
    isSheetOpen.value = false
  } catch (error) {
    console.error('Error al crear al usuario:', error)
  }
}

function handleCancel() {
  isSheetOpen.value = false
}

function handleAddUser() {
  isSheetOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-4 px-6 py-4">
    <Sheet v-model:open="isSheetOpen">
      <UsersList
        :users="usersStore.users"
        :is-loading="usersStore.isFetching"
        @add-user="handleAddUser"
      />
      <!--Mobile -->
      <SheetTrigger as-child class="md:hidden">
        <Button
          size="icon"
          class="fixed right-4 bottom-4 z-50 h-10 w-10 rounded-full"
          aria-label="Agregar usuario"
        >
          <UserPlus />
        </Button>
      </SheetTrigger>
      <SheetContent
        :side="isDesktop ? 'right' : 'bottom'"
        class="w-full py-4 sm:max-w-md"
        :class="!isDesktop ? 'h-dvh rounded-t-2xl' : ''"
      >
        <SheetHeader class="pt-0 pb-2">
          <SheetTitle>Crear usuario</SheetTitle>
          <SheetDescription>Completa la información del nuevo usuario</SheetDescription>
        </SheetHeader>
        <UserForm
          :is-loading="usersStore.isCreating"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>
