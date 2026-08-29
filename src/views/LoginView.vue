<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

function handleSubmit() {
  isLoading.value = true
  console.log('Credenciales:', { email: email.value, password: password.value })
  isLoading.value = false
}
</script>

<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader class="text-center text-xl">
          <CardTitle>Inicio de Sesión</CardTitle>
          <CardDescription>Ingresa tu correo y contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSubmit">
            <FieldGroup>
              <Field>
                <FieldLabel for="email">Correo Electrónico</FieldLabel>
                <Input
                  v-model="email"
                  id="email"
                  type="email"
                  placeholder="usuario@gmail.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel for="password">Contraseña</FieldLabel>
                <div class="relative flex items-center">
                  <Input
                    v-model="password"
                    id="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="pr-10"
                    required
                  />
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground absolute right-3 flex items-center"
                    @click="showPassword = !showPassword"
                  >
                    <Eye v-if="!showPassword" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" :disabled="isLoading">
                  {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
