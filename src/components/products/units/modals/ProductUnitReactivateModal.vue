<script setup>
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Loader2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
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
import { useProductsStore } from '@/stores/products'
import { getReactivateUnitErrorMessage } from '@/utils/inventoryErrors'

const props = defineProps({
  open: { type: Boolean, default: false },
  unit: { type: Object, default: null },
  product: { type: Object, default: null },
})

const emit = defineEmits(['update:open', 'success'])

const productsStore = useProductsStore()
const isDesktop = useMediaQuery('(min-width: 768px)')

const openModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const NOTE_MAX = 500

const note = ref('')
const errorMessage = ref(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      note.value = ''
      errorMessage.value = null
    }
  },
)

async function handleSubmit() {
  if (!props.unit) {
    return
  }

  errorMessage.value = null

  try {
    await productsStore.reactivateUnit({
      unit_id: props.unit.id,
      note: note.value.trim() || null,
    })

    emit('success', { unit: props.unit })
    openModel.value = false
  } catch (e) {
    console.error('Error al reactivar unidad:', e)
    errorMessage.value = getReactivateUnitErrorMessage(e)
  }
}

function handleCancel() {
  errorMessage.value = null
  openModel.value = false
}
</script>

<template>
  <!-- Desktop -->
  <Dialog v-if="isDesktop" v-model:open="openModel">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-md">
      <DialogHeader class="border-border/60 px-6 pt-6">
        <DialogTitle>Reactivar unidad</DialogTitle>
        <DialogDescription v-if="unit" class="pb-2">
          Unidad {{ unit.id.slice(0, 8) }}
          <span v-if="product">- {{ product.name }}</span>
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 px-6">
        <!-- Error alert -->
        <Alert v-if="errorMessage" variant="destructive">
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>
        <!-- Note -->
        <Field>
          <FieldLabel for="reactivate-note">Nota (opcional)</FieldLabel>
          <Textarea
            id="reactivate-note"
            v-model="note"
            :maxlength="NOTE_MAX"
            placeholder="Revisada, vuelve al estante"
            rows="3"
            class="text-sm"
          />
        </Field>
        <!-- Info -->
        <p class="text-muted-foreground text-xs">
          Al confirmar, la unidad volverá a estar disponible para la venta.
        </p>
      </div>
      <!-- Action buttons -->
      <div
        class="border-border/60 flex flex-col-reverse gap-2 px-6 py-6 sm:flex-row sm:justify-end"
      >
        <Button
          type="button"
          variant="outline"
          :disabled="productsStore.isReactivatingUnit"
          @click="handleCancel"
        >
          Cancelar
        </Button>
        <Button type="button" :disabled="productsStore.isReactivatingUnit" @click="handleSubmit">
          <Loader2 v-if="productsStore.isReactivatingUnit" class="mr-2 h-4 w-4 animate-spin" />
          {{ productsStore.isReactivatingUnit ? 'Reactivando…' : 'Reactivar unidad' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent class="max-h-[85vh]">
      <DrawerHeader class="border-border/60 px-6 pb-2 text-left">
        <DrawerTitle>Reactivar unidad</DrawerTitle>
        <DrawerDescription v-if="unit" >
          Unidad {{ unit.id.slice(0, 8) }}
          <span v-if="product">- {{ product.name }}</span>
        </DrawerDescription>
      </DrawerHeader>
      <div class="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
        <!-- Error alert -->
        <Alert v-if="errorMessage" variant="destructive">
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>
        <!-- Note -->
        <Field>
          <FieldLabel for="reactivate-note-mobile">Nota (opcional)</FieldLabel>
          <Textarea
            id="reactivate-note-mobile"
            v-model="note"
            :maxlength="NOTE_MAX"
            placeholder="Revisada, vuelve al estante"
            rows="3"
            class="text-sm"
          />
        </Field>
        <!-- Info -->
        <p class="text-muted-foreground text-xs">
          Al confirmar, la unidad volverá a estar disponible para la venta.
        </p>
        <!-- Action buttons -->
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            :disabled="productsStore.isReactivatingUnit"
            @click="handleCancel"
          >
            Cancelar
          </Button>
          <Button type="button" :disabled="productsStore.isReactivatingUnit" @click="handleSubmit">
            <Loader2 v-if="productsStore.isReactivatingUnit" class="h-4 w-4 animate-spin" />
            {{ productsStore.isReactivatingUnit ? 'Reactivando…' : 'Reactivar unidad' }}
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
