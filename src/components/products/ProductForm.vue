<script setup>
import { reactive } from 'vue'
import { Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import ProductImageUploader from '@/components/products/ProductImageUploader.vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['submit', 'cancel'])

function getInitialForm() {
  return {
    name: '',
    category: '',
    brand: '',
    color: '',
    size: '',
    price: null,
    image: null,
    minStock: 0,
  }
}

const form = reactive(getInitialForm())

function handleSubmit() {
  emit('submit', { ...form })
}

function handleCancel() {
  Object.assign(form, getInitialForm())
  emit('cancel')
}
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSubmit">
    <!-- Form fields -->
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
      <!-- Image -->
      <ProductImageUploader v-model="form.image" />
      <!-- Name -->
      <Field>
        <FieldLabel for="name">Nombre</FieldLabel>
        <Input id="name" v-model="form.name" type="text" placeholder="Camisa manga larga" />
      </Field>
      <!-- Category + brand -->
      <div class="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel for="category">Categoría</FieldLabel>
          <Input id="category" v-model="form.category" type="text" placeholder="Camisas" />
        </Field>
        <Field>
          <FieldLabel for="brand">Marca</FieldLabel>
          <Input id="brand" v-model="form.brand" type="text" placeholder="Nike" />
        </Field>
      </div>
      <!-- Color + size -->
      <div class="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel for="color">Color</FieldLabel>
          <Input id="color" v-model="form.color" type="text" placeholder="Azul Marino" />
        </Field>
        <Field>
          <FieldLabel for="size">Talla</FieldLabel>
          <Input id="size" v-model="form.size" type="text" placeholder="M" />
        </Field>
      </div>
      <!-- Price + min stock -->
      <div class="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel for="price">Precio</FieldLabel>
          <Input
            id="price"
            v-model="form.price"
            type="text"
            inputmode="decimal"
            step="0.01"
            placeholder="0.00"
          />
        </Field>
        <Field>
          <FieldLabel for="minStock">Stock mínimo</FieldLabel>
          <Input
            id="minStock"
            v-model="form.minStock"
            type="text"
            inputmode="numeric"
            placeholder="0"
          />
        </Field>
      </div>
    </div>
    <!-- Actions buttons -->
    <div class="flex flex-col gap-2 pt-6 md:flex-row-reverse">
      <Button type="submit" class="md:flex-1" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="animate-spin" />
        {{ isLoading ? 'Guardando...' : 'Guardar' }}
      </Button>
      <Button type="button" variant="outline" class="md:flex-1" @click="handleCancel">
        Cancelar
      </Button>
    </div>
  </form>
</template>
