<script setup>
import { ref } from 'vue'
import { Eye, EyeOff, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const emit = defineEmits(['submit', 'cancel'])

const getInitialForm = () => ({
  email: '',
  password: '',
  fullName: '',
  role: '',
})

const formData = ref(getInitialForm())
const showPassword = ref(false)
const isLoading = ref(false)

function resetForm() {
  formData.value = getInitialForm()
  showPassword.value = false
}

function handleSubmit() {
  isLoading.value = true

  setTimeout(() => {
    isLoading.value = false
    emit('submit', { ...formData.value })
    resetForm()
  }, 3000)
}

function handleCancel() {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col px-4" @submit.prevent="handleSubmit">
    <FieldGroup class="min-h-0 flex-1 gap-4 overflow-y-auto">
      <Field>
        <FieldLabel for="fullName">Nombre completo</FieldLabel>
        <Input
          id="fullName"
          v-model="formData.fullName"
          type="text"
          placeholder="Nombre(s) y apellido(s)"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="email">Correo electrónico</FieldLabel>
        <Input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="correo@ejemplo.com"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="password">Contraseña</FieldLabel>
        <div class="relative flex items-center">
          <Input
            id="password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="pr-10"
            required
          />
          <button
            type="button"
            tabindex="-1"
            class="text-muted-foreground hover:text-foreground absolute right-3 flex items-center"
            @click="showPassword = !showPassword"
          >
            <Eye v-if="!showPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
      </Field>
      <Field>
        <FieldLabel>Rol</FieldLabel>
        <RadioGroup v-model="formData.role">
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="admin" value="admin" />
            <Label for="admin" class="cursor-pointer">Administrador</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="advisor" value="advisor" />
            <Label for="advisor" class="cursor-pointer">Vendedor</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="cashier" value="cashier" />
            <Label for="cashier" class="cursor-pointer">Cajero</Label>
          </div>
        </RadioGroup>
      </Field>
    </FieldGroup>
    <div class="flex flex-col gap-2 pt-4">
      <Button type="submit" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="animate-spin" />
        {{ isLoading ? 'Guardando...' : 'Guardar' }}
      </Button>
      <Button type="button" variant="outline" @click="handleCancel">Cancelar</Button>
    </div>
  </form>
</template>
