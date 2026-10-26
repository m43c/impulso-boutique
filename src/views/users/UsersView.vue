<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useMediaQuery } from '@vueuse/core'
import { UserPlus } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import UserForm from '@/components/users/UserForm.vue'
import UsersList from '@/components/users/UsersList.vue'
import { getEdgeFunctionErrorMessage } from '@/utils/edgeFunctionErrors'

const authStore = useAuthStore()
const usersStore = useUsersStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

const isFormOpen = ref(false)
const editingUser = ref(null)
const fetchError = ref(null)
const formError = ref(null)

const isSelf = computed(() => !!editingUser.value && editingUser.value.id === authStore.user?.id)
const currentUserId = computed(() => authStore.user?.id)

async function loadUsers() {
  fetchError.value = null

  try {
    await usersStore.fetchUsers()
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    fetchError.value = 'No se pudieron cargar los usuarios'
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
    isFormOpen.value = false
    editingUser.value = null
  } catch (error) {
    console.error('Error al guardar al usuario:', error)

    const fallback = isEditing ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario'
    const message = await getEdgeFunctionErrorMessage(error, fallback)

    formError.value = message
    toast.error(message)
  }
}

function handleCancel() {
  isFormOpen.value = false
  editingUser.value = null
  formError.value = null
}

function handleAddUser() {
  editingUser.value = null
  formError.value = null
  isFormOpen.value = true
}

function handleEditUser(user) {
  editingUser.value = user
  formError.value = null
  isFormOpen.value = true
}

async function handleToggleStatus(user) {
  if (user.id === authStore.user?.id) {
    toast.error('No puedes desactivar tu propia cuenta')
    return
  }

  const isDeactivating = user.is_active
  const actionText = isDeactivating ? 'desactivar' : 'activar'

  try {
    await usersStore.toggleUserStatus(user.id, !isDeactivating)
    toast.success(`Usuario ${isDeactivating ? 'desactivado' : 'activado'} correctamente`)
    usersStore.fetchUsers()
  } catch (error) {
    console.error(`Error al ${actionText} usuario:`, error)
    const message = await getEdgeFunctionErrorMessage(error, `No se pudo ${actionText} el usuario`)
    toast.error(message)
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <!-- Users list -->
    <UsersList
      :users="usersStore.users"
      :is-loading="usersStore.isFetching"
      :is-updating-status="usersStore.isTogglingStatus"
      :error="fetchError"
      :current-user-id="currentUserId"
      @add-user="handleAddUser"
      @edit-user="handleEditUser"
      @toggle-status="handleToggleStatus"
      @retry="loadUsers"
      @refresh="loadUsers"
    />
    <!-- Floating add user button (mobile) -->
    <Button
      v-if="!fetchError"
      size="icon"
      class="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full md:hidden"
      aria-label="Agregar usuario"
      :disabled="usersStore.isFetching"
      @click="handleAddUser"
    >
      <UserPlus class="size-5" />
    </Button>
    <!-- Dialog (desktop) -->
    <Dialog v-if="isDesktop" v-model:open="isFormOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingUser ? 'Editar usuario' : 'Crear usuario' }}</DialogTitle>
          <DialogDescription>
            {{
              editingUser
                ? 'Actualiza la información del usuario'
                : 'Completa la información del nuevo usuario'
            }}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          :user="editingUser"
          :is-self="isSelf"
          :is-loading="usersStore.isCreating || usersStore.isUpdating"
          :error-message="formError"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </DialogContent>
    </Dialog>
    <!-- Drawer (mobile) -->
    <Drawer v-else v-model:open="isFormOpen">
      <DrawerContent class="h-[90dvh]">
        <DrawerHeader class="text-left">
          <DrawerTitle>{{ editingUser ? 'Editar usuario' : 'Crear usuario' }}</DrawerTitle>
          <DrawerDescription>
            {{
              editingUser
                ? 'Actualiza la información del usuario'
                : 'Completa la información del nuevo usuario'
            }}
          </DrawerDescription>
        </DrawerHeader>
        <div class="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <UserForm
            :user="editingUser"
            :is-self="isSelf"
            :is-loading="usersStore.isCreating || usersStore.isUpdating"
            :error-message="formError"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </div>
      </DrawerContent>
    </Drawer>
  </div>
</template>
