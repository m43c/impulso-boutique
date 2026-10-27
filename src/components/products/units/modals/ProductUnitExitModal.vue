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
import { getRegisterExitErrorMessage } from '@/utils/inventoryErrors'

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

const reasons = [
  { value: 'damage', label: 'Daño' },
  { value: 'loss', label: 'Pérdida' },
]

const NOTE_MAX = 500

const reason = ref('damage')
const note = ref('')
const errorMessage = ref(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      reason.value = 'damage'
      note.value = ''
      errorMessage.value = null
    }
  },
)

const submitLabel = computed(() =>
  reason.value === 'damage' ? 'Registrar daño' : 'Registrar pérdida',
)

const notePlaceholder = computed(() =>
  reason.value === 'damage'
    ? 'Se manchó de tinta durante el traslado'
    : 'No se encontró durante el conteo físico',
)

async function handleSubmit() {
  if (!props.unit) {
    return
  }

  errorMessage.value = null

  try {
    await productsStore.registerUnitExit({
      unit_id: props.unit.id,
      reason: reason.value,
      note: note.value.trim() || null,
    })

    emit('success', { unit: props.unit, reason: reason.value })
    openModel.value = false
  } catch (e) {
    console.error('Error al registrar salida:', e)
    errorMessage.value = getRegisterExitErrorMessage(e)
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
        <DialogTitle>Registrar salida de unidad</DialogTitle>
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
        <Field>
          <!-- Reason -->
          <FieldLabel>Motivo</FieldLabel>
          <div class="border-border/60 inline-flex w-full rounded-md border p-0.5">
            <button
              v-for="r in reasons"
              :key="r.value"
              type="button"
              class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition"
              :class="
                reason === r.value
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="reason = r.value"
            >
              {{ r.label }}
            </button>
          </div>
        </Field>
        <!-- Note -->
        <Field>
          <FieldLabel for="exit-note">Nota (opcional)</FieldLabel>
          <Textarea
            id="exit-note"
            v-model="note"
            :maxlength="NOTE_MAX"
            :placeholder="notePlaceholder"
            rows="3"
            class="text-sm"
          />
        </Field>
        <!-- Info -->
        <p class="text-muted-foreground text-xs">
          Al confirmar, la unidad dejará de estar disponible para la venta. Quedará registrado en el
          historial.
        </p>
      </div>
      <!-- Action buttons -->
      <div
        class="border-border/60 flex flex-col-reverse gap-2 px-6 py-6 sm:flex-row sm:justify-end"
      >
        <Button
          type="button"
          variant="outline"
          :disabled="productsStore.isRegisteringExit"
          @click="handleCancel"
        >
          Cancelar
        </Button>
        <Button type="button" :disabled="productsStore.isRegisteringExit" @click="handleSubmit">
          <Loader2 v-if="productsStore.isRegisteringExit" class="h-4 w-4 animate-spin" />
          {{ productsStore.isRegisteringExit ? 'Registrando…' : submitLabel }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent class="max-h-[85vh]">
      <DrawerHeader class="border-border/60 px-6 pb-2 text-left">
        <DrawerTitle>Registrar salida de unidad</DrawerTitle>
        <DrawerDescription v-if="unit">
          Unidad {{ unit.id.slice(0, 8) }}
          <span v-if="product">- {{ product.name }}</span>
        </DrawerDescription>
      </DrawerHeader>
      <div class="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
        <!-- Error alert -->
        <Alert v-if="errorMessage" variant="destructive">
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>
        <!-- Reason -->
        <Field>
          <FieldLabel>Motivo</FieldLabel>
          <div class="border-border/60 inline-flex w-full rounded-md border p-0.5">
            <button
              v-for="r in reasons"
              :key="r.value"
              type="button"
              class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition"
              :class="
                reason === r.value
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="reason = r.value"
            >
              {{ r.label }}
            </button>
          </div>
        </Field>
        <!-- Note -->
        <Field>
          <FieldLabel for="exit-note-mobile">Nota (opcional)</FieldLabel>
          <Textarea
            id="exit-note-mobile"
            v-model="note"
            :maxlength="NOTE_MAX"
            :placeholder="notePlaceholder"
            rows="3"
            class="text-sm"
          />
        </Field>
        <!-- Info -->
        <p class="text-muted-foreground text-xs">
          Al confirmar, la unidad dejará de estar disponible para la venta. Quedará registrado en el
          historial.
        </p>
        <!-- Action buttons -->
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            :disabled="productsStore.isRegisteringExit"
            @click="handleCancel"
          >
            Cancelar
          </Button>
          <Button type="button" :disabled="productsStore.isRegisteringExit" @click="handleSubmit">
            <Loader2 v-if="productsStore.isRegisteringExit" class="h-4 w-4 animate-spin" />
            {{ productsStore.isRegisteringExit ? 'Registrando…' : submitLabel }}
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
