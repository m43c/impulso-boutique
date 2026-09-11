<script setup>
import { ref } from 'vue'
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
import UserForm from '@/components/UserForm.vue'
import { useUsersStore } from '@/stores/users'

const usersStore = useUsersStore()

const isSheetOpen = ref(false)
const isDesktop = useMediaQuery('(min-width: 640px)')

async function handleSubmit(formData) {
  try {
    const createdUser = await usersStore.createUser({
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      role: formData.role,
    })

    console.log('Usuario creado:', createdUser)
    isSheetOpen.value = false
  } catch (error) {
    console.error('Error al crear al usuario:', error)
  }
}

function handleCancel() {
  isSheetOpen.value = false
}
</script>

<template>
  <div class="flex justify-end px-4 pt-2">
    <Sheet v-model:open="isSheetOpen">
      <SheetTrigger as-child class="sm:hidden">
        <Button
          size="icon"
          class="fixed right-4 bottom-4 z-50 h-10 w-10 rounded-full"
          aria-label="Agregar usuario"
        >
          <UserPlus />
        </Button>
      </SheetTrigger>
      <div class="hidden sm:flex sm:justify-end">
        <SheetTrigger as-child>
          <Button class="gap-2">
            <UserPlus class="h-4 w-4" />
            Agregar usuario
          </Button>
        </SheetTrigger>
      </div>
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
