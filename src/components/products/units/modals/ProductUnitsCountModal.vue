<script setup>
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Check, Dot, Loader2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProductsStore } from '@/stores/products'
import { formatDate } from '@/utils/date'
import { getRegisterCountErrorMessage } from '@/utils/inventoryErrors'

const props = defineProps({
  open: { type: Boolean, default: false },
  product: { type: Object, default: null },
  units: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'success'])

const productsStore = useProductsStore()
const isDesktop = useMediaQuery('(min-width: 768px)')

const openModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const NOTE_MAX = 500

const step = ref('checking')
const frozenUnits = ref([])
const checked = ref({})
const note = ref('')
const errorMessage = ref(null)

const total = computed(() => frozenUnits.value.length)
const foundCount = computed(() => frozenUnits.value.filter((u) => checked.value[u.id]).length)
const missingUnits = computed(() => frozenUnits.value.filter((u) => !checked.value[u.id]))

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      frozenUnits.value = [...props.units]
      step.value = 'checking'
      checked.value = {}
      note.value = ''
      errorMessage.value = null
    }
  },
)

const title = computed(() => {
  if (step.value === 'checking') {
    return 'Conteo físico'
  }

  if (step.value === 'confirm') {
    return 'Resultado del conteo'
  }

  return 'Todo coincide'
})

const description = computed(() => {
  if (step.value === 'checking') {
    return 'Marca las unidades que encontraste físicamente en la tienda.'
  }

  if (step.value === 'confirm') {
    return 'Revisa las unidades que se marcarán como no disponibles.'
  }

  return 'Las unidades disponibles están todas presentes.'
})

function toggleUnit(unitId) {
  checked.value = { ...checked.value, [unitId]: !checked.value[unitId] }
}

function handleFinalize() {
  if (foundCount.value === total.value) {
    step.value = 'all-matched'
  } else {
    step.value = 'confirm'
  }
}

function handleBack() {
  step.value = 'checking'
  errorMessage.value = null
}

function handleClose() {
  openModel.value = false
}

async function handleConfirm() {
  if (missingUnits.value.length === 0) {
    return
  }

  errorMessage.value = null

  try {
    await productsStore.registerCountMissing({
      unit_ids: missingUnits.value.map((u) => u.id),
      note: note.value.trim() || null,
    })

    emit('success', {
      total: total.value,
      found: foundCount.value,
      missing: missingUnits.value.length,
      missingIds: missingUnits.value.map((u) => u.id),
    })

    openModel.value = false
  } catch (e) {
    console.error('Error al confirmar conteo:', e)
    errorMessage.value = getRegisterCountErrorMessage(e)
  }
}

const isSubmitting = computed(() => productsStore.isRegisteringCount)
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="openModel">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-sm">
      <DialogHeader class="border-border/60 gap-0 px-6 pt-6 pb-3">
        <!-- Title -->
        <DialogTitle>{{ title }}</DialogTitle>
        <!-- Product name -->
        <TooltipProvider v-if="product" :delay-duration="200">
          <Tooltip>
            <TooltipTrigger as-child>
              <div
                class="my-1.5 line-clamp-2 w-full cursor-default text-left text-sm font-medium wrap-break-word"
              >
                {{ product.name }}
              </div>
            </TooltipTrigger>
            <TooltipContent class="max-w-80 wrap-break-word">
              <p>{{ product.name }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <!-- Description -->
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <!-- Step 1: Checking -->
      <template v-if="step === 'checking'">
        <div class="flex flex-col gap-3 px-6">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Encontradas</span>
            <span class="font-semibold">{{ foundCount }} de {{ total }}</span>
          </div>
          <!-- Unit list -->
          <div
            role="group"
            aria-label="Lista de unidades disponibles"
            class="border-border/60 max-h-[45vh] overflow-y-auto rounded-md border"
          >
            <button
              v-for="unit in frozenUnits"
              :key="unit.id"
              type="button"
              class="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0"
              @click="toggleUnit(unit.id)"
            >
              <Checkbox
                :model-value="!!checked[unit.id]"
                tabindex="-1"
                class="pointer-events-none"
              />
              <span class="font-mono text-sm font-medium">{{ unit.id.slice(0, 8) }}</span>
              <span class="text-muted-foreground ml-auto text-xs">
                Ingresó {{ formatDate(unit.created_at) }}
              </span>
            </button>
          </div>
          <!-- Hint -->
          <div class="text-muted-foreground flex items-start gap-2 text-xs">
            <p>
              ¿Encontraste una unidad no registrada? Usa
              <strong class="font-medium">Agregar unidades</strong>
              con motivo
              <em>Ajuste por conteo.</em>
            </p>
          </div>
        </div>
        <!-- Action buttons -->
        <div
          class="border-border/60 mt-4 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end"
        >
          <Button type="button" variant="outline" @click="handleClose">Cancelar</Button>
          <Button type="button" @click="handleFinalize">Finalizar conteo</Button>
        </div>
      </template>
      <!-- Step 2: Confirm -->
      <template v-else-if="step === 'confirm'">
        <div class="flex flex-col gap-4 px-6">
          <!-- Error message -->
          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>
          <!-- Info -->
          <div class="grid grid-cols-3 gap-2 rounded-md border p-3 text-center text-sm">
            <div class="flex flex-col">
              <span class="text-muted-foreground text-xs">Esperadas</span>
              <span class="text-base font-semibold">{{ total }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground text-xs">Encontradas</span>
              <span class="text-base font-semibold text-emerald-500">{{ foundCount }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground text-xs">Faltan</span>
              <span class="text-destructive text-base font-semibold">
                {{ missingUnits.length }}
              </span>
            </div>
          </div>
          <div>
            <p class="mb-1.5 text-sm font-medium">
              Se marcarán como
              <span class="text-destructive">No disponible</span>
              :
            </p>
            <div class="border-border/60 max-h-40 overflow-y-auto rounded-md border p-2">
              <ul class="flex flex-col gap-1">
                <li v-for="unit in missingUnits" :key="unit.id" class="font-mono text-xs">
                  <div class="flex gap-1.5">
                    <Dot class="h-4 w-4" />
                    <span>{{ unit.id.slice(0, 8) }}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <!-- Note -->
          <Field>
            <FieldLabel for="count-note">Nota (opcional)</FieldLabel>
            <Textarea
              id="count-note"
              v-model="note"
              :maxlength="NOTE_MAX"
              placeholder="Conteo de fin de mes"
              rows="2"
              class="text-sm"
            />
          </Field>
          <!-- Hint -->
          <p class="text-muted-foreground text-xs">
            Al confirmar,
            {{
              missingUnits.length === 1
                ? 'esta unidad dejará de estar disponible.'
                : 'estas unidades dejarán de estar disponibles.'
            }}
            Quedará registrado en el historial de cada una.
          </p>
        </div>
        <!-- Action buttons -->
        <div
          class="border-border/60 mt-4 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end"
        >
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="handleBack">
            Volver
          </Button>
          <Button type="button" :disabled="isSubmitting" @click="handleConfirm">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            {{ isSubmitting ? 'Confirmando…' : 'Confirmar ajuste' }}
          </Button>
        </div>
      </template>
      <!-- Step 3: All matched -->
      <template v-else>
        <div class="flex flex-col items-center gap-3 px-6 py-6 text-center">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
          >
            <Check class="h-8 w-8" />
          </div>
          <p class="text-sm">
            Las
            <strong>{{ total }}</strong>
            unidades disponibles están físicamente en la tienda.
          </p>
          <p class="text-muted-foreground text-xs">No se requiere ningún ajuste.</p>
        </div>
        <!-- Action button -->
        <div
          class="border-border/60 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end"
        >
          <Button type="button" @click="handleClose">Cerrar</Button>
        </div>
      </template>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent class="max-h-[90vh]">
      <DrawerHeader class="border-border/60 gap-0 px-6 pb-2 text-left">
        <!-- Title -->
        <DrawerTitle>{{ title }}</DrawerTitle>
        <!-- Product name -->
        <TooltipProvider v-if="product" :delay-duration="200">
          <Tooltip>
            <TooltipTrigger as-child>
              <div
                class="mb-1.5 line-clamp-2 w-full cursor-default text-left text-sm font-medium wrap-break-word"
              >
                {{ product.name }}
              </div>
            </TooltipTrigger>
            <TooltipContent class="max-w-70 wrap-break-word">
              <p>{{ product.name }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <!-- Description -->
        <DrawerDescription>{{ description }}</DrawerDescription>
      </DrawerHeader>
      <div class="flex min-h-0 flex-col overflow-y-auto">
        <!-- Step 1: Checking -->
        <template v-if="step === 'checking'">
          <div class="flex flex-col gap-3 px-6">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Encontradas</span>
              <span class="font-semibold">{{ foundCount }} de {{ total }}</span>
            </div>
            <!-- Unit list -->
            <div
              role="group"
              aria-label="Lista de unidades disponibles"
              class="border-border/60 max-h-[50vh] overflow-y-auto rounded-md border"
            >
              <button
                v-for="unit in frozenUnits"
                :key="unit.id"
                type="button"
                class="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0"
                @click="toggleUnit(unit.id)"
              >
                <Checkbox
                  :model-value="!!checked[unit.id]"
                  tabindex="-1"
                  class="pointer-events-none"
                />
                <span class="font-mono text-sm font-medium">{{ unit.id.slice(0, 8) }}</span>
                <span class="text-muted-foreground ml-auto text-xs">
                  {{ formatDate(unit.created_at) }}
                </span>
              </button>
            </div>
            <!-- Hint -->
            <div class="text-muted-foreground flex items-start gap-2 text-xs">
              <p>
                ¿Encontraste una unidad no registrada? Usa
                <strong class="font-medium">Agregar unidades</strong>
                con motivo
                <em>Ajuste por conteo.</em>
              </p>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="mt-4 flex flex-col-reverse gap-2 px-6 pb-6">
            <Button type="button" variant="outline" @click="handleClose">Cancelar</Button>
            <Button type="button" @click="handleFinalize">Finalizar conteo</Button>
          </div>
        </template>
        <!-- Step 2: Confirm -->
        <template v-else-if="step === 'confirm'">
          <div class="flex flex-col gap-4 px-6">
            <!-- Error menssage -->
            <Alert v-if="errorMessage" variant="destructive">
              <AlertDescription>{{ errorMessage }}</AlertDescription>
            </Alert>
            <!-- Info -->
            <div class="grid grid-cols-3 gap-2 rounded-md border p-3 text-center text-sm">
              <div class="flex flex-col">
                <span class="text-muted-foreground text-xs">Esperadas</span>
                <span class="text-base font-semibold">{{ total }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-muted-foreground text-xs">Encontradas</span>
                <span class="text-base font-semibold text-emerald-500">{{ foundCount }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-muted-foreground text-xs">Faltan</span>
                <span class="text-destructive text-base font-semibold">
                  {{ missingUnits.length }}
                </span>
              </div>
            </div>
            <div>
              <p class="mb-1.5 text-sm font-medium">
                Se marcarán como
                <span class="text-destructive">No disponible</span>
                :
              </p>
              <div class="border-border/60 max-h-40 overflow-y-auto rounded-md border p-2">
                <ul class="flex flex-col gap-1">
                  <li v-for="unit in missingUnits" :key="unit.id" class="font-mono text-xs">
                    <div class="flex gap-1.5">
                      <Dot class="h-4 w-4" />
                      <span>{{ unit.id.slice(0, 8) }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <!-- Note -->
            <Field>
              <FieldLabel for="count-note-mobile">Nota (opcional)</FieldLabel>
              <Textarea
                id="count-note-mobile"
                v-model="note"
                :maxlength="NOTE_MAX"
                placeholder="Conteo de fin de mes"
                rows="2"
                class="text-sm"
              />
            </Field>
            <!-- Hint -->
            <p class="text-muted-foreground text-xs">
              Al confirmar,
              {{
                missingUnits.length === 1
                  ? 'esta unidad dejará de estar disponible.'
                  : 'estas unidades dejarán de estar disponibles.'
              }}
              Quedará registrado en el historial de cada una.
            </p>
          </div>
          <!-- Action buttons -->
          <div class="mt-4 flex flex-col-reverse gap-2 px-6 pb-6">
            <Button type="button" variant="outline" :disabled="isSubmitting" @click="handleBack">
              Volver
            </Button>
            <Button type="button" :disabled="isSubmitting" @click="handleConfirm">
              <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
              {{ isSubmitting ? 'Confirmando…' : 'Confirmar ajuste' }}
            </Button>
          </div>
        </template>
        <!-- Step 3: All matched -->
        <template v-else>
          <div class="flex flex-col items-center gap-3 px-6 py-6 text-center">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
            >
              <Check class="h-8 w-8" />
            </div>
            <p class="text-sm">
              Las
              <strong>{{ total }}</strong>
              unidades disponibles están físicamente en la tienda.
            </p>
            <p class="text-muted-foreground text-xs">No se requiere ningún ajuste.</p>
          </div>
          <!-- Action button -->
          <div class="flex flex-col gap-2 px-6 pb-6">
            <Button type="button" @click="handleClose">Cerrar</Button>
          </div>
        </template>
      </div>
    </DrawerContent>
  </Drawer>
</template>
