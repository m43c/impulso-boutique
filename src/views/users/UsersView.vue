<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useMediaQuery } from '@vueuse/core'
import { UserPlus } from '@lucide/vue'
import { toast } from 'vue-sonner'
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
import { getEdgeFunctionErrorMessage } from '@/utils/edgeFunctionErrors'

const authStore = useAuthStore()
const usersStore = useUsersStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

const isSheetOpen = ref(false)
const editingUser = ref(null)
const fetchError = ref(null)
const formError = ref(null)

const isSelf = computed(() => !!editingUser.value && editingUser.value.id === authStore.user?.id)

async function loadUsers() {
  fetchError.value = null

  try {
    await usersStore.fetchUsers()
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    fetchError.value = 'No se puedieron cargar los usuarios'
  }
}

onMounted(() => loadUsers())

async function handleSubmit(formData) {
  const isEditing = !!editingUser.value
  formError.value = null

  try {
    if (editingUser.value) {
      const payload = {
        user_id: editingUser.value.id,
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role,
        is_active: formData.isActive,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      await usersStore.updateUser(payload)
      toast.success('Usuario actualizado correctamente')
    } else {
      await usersStore.createUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role,
      })
      toast.success('Usuario creado correctamente')
    }

    usersStore.fetchUsers()
    isSheetOpen.value = false
    editingUser.value = null
  } catch (error) {
    console.error('Error al guardar al usuario:', error)

    const fallback = isEditing ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario'
    const message = await getEdgeFunctionErrorMessage(error, fallback)
    console.log(message)

    formError.value = message
    toast.error(message)
  }
}

function handleCancel() {
  isSheetOpen.value = false
  editingUser.value = null
  formError.value = null
}

function handleAddUser() {
  editingUser.value = null
  formError.value = null
  isSheetOpen.value = true
}

function handleEditUser(user) {
  editingUser.value = user
  formError.value = null
  isSheetOpen.value = true
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <Sheet v-model:open="isSheetOpen">
      <UsersList
        :users="usersStore.users"
        :is-loading="usersStore.isFetching"
        :error="fetchError"
        @add-user="handleAddUser"
        @edit-user="handleEditUser"
        @retry="loadUsers"
      />
      <!--Mobile -->
      <SheetTrigger v-if="!fetchError" as-child class="md:hidden">
        <Button
          size="icon"
          class="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full"
          aria-label="Agregar usuario"
          @click="handleAddUser"
        >
          <UserPlus class="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        :side="isDesktop ? 'right' : 'bottom'"
        class="w-full p-6 sm:max-w-md"
        :class="!isDesktop ? 'h-[90dvh] rounded-t-2xl' : ''"
      >
        <SheetHeader class="p-0 pb-2">
          <SheetTitle>{{ editingUser ? 'Editar usuario' : 'Crear usuario' }}</SheetTitle>
          <SheetDescription>
            {{
              editingUser
                ? 'Actualiza la información del usuario'
                : 'Completa la información del nuevo usuario'
            }}
          </SheetDescription>
        </SheetHeader>
        <UserForm
          :user="editingUser"
          :is-self="isSelf"
          :is-loading="usersStore.isCreating || usersStore.isUpdating"
          :error-message="formError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>
