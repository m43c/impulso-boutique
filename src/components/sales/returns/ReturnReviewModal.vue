<script setup>
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { CircleAlert, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
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

const props = defineProps({
  unit: { type: Object, default: null },
  approve: { type: Boolean, default: true },
  isSubmitting: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['confirm'])

const isDesktop = useMediaQuery('(min-width: 768px)')
const note = ref('')

const title = computed(() => (props.approve ? 'Aprobar devolución' : 'Descartar unidad'))
const actionLabel = computed(() => (props.approve ? 'Aprobar' : 'Descartar'))
const description = computed(() => {
  if (!props.unit) {
    return ''
  }

  const lines = []

  if (props.unit.product_name) {
    lines.push(props.unit.product_name)
  }

  const variant = [props.unit.color, props.unit.size].filter(Boolean).join(' · ')

  if (variant) {
    lines.push(variant)
  }

  if (props.unit.unit_code) {
    lines.push(props.unit.unit_code)
  }

  return lines.join('\n')
})

const explanation = computed(() =>
  props.approve
    ? 'La unidad volverá a estar disponible para la venta.'
    : 'La unidad pasará a "No disponible" y no volverá al stock. Se conserva el registro.',
)

watch(open, (isOpen) => {
  if (isOpen) {
    note.value = ''
  }
})

function submit() {
  if (props.isSubmitting || !props.unit) {
    return
  }

  emit('confirm', note.value)
}
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="open">
    <DialogContent class="gap-0 p-0 sm:max-w-sm">
      <DialogHeader class="gap-1 px-6 pt-5 pb-2">
        <DialogTitle class="text-[13px]">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="text-xs whitespace-pre-line">
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-2 px-6 pb-4">
        <p class="text-muted-foreground text-xs">{{ explanation }}</p>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" for="return-review-note-desktop">
            Nota (opcional)
          </label>
          <Textarea
            id="return-review-note-desktop"
            v-model="note"
            rows="2"
            placeholder="Agrega una nota si lo necesitas"
            class="min-h-16 text-xs!"
            :disabled="isSubmitting"
          />
        </div>
        <div
          v-if="error"
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
        >
          <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
          <p>{{ error }}</p>
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" size="sm" :disabled="isSubmitting" @click="open = false">
          <span class="text-xs">Cancelar</span>
        </Button>
        <Button
          size="sm"
          :variant="approve ? 'default' : 'destructive'"
          :disabled="isSubmitting"
          @click="submit"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <span class="text-xs">{{ actionLabel }}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="open">
    <DrawerContent class="flex flex-col pb-5">
      <DrawerHeader class="gap-0 px-5 pt-3 pb-2 text-left">
        <DrawerTitle class="text-sm">{{ title }}</DrawerTitle>
        <DrawerDescription v-if="description" class="text-xs whitespace-pre-line">
          {{ description }}
        </DrawerDescription>
      </DrawerHeader>
      <div class="flex flex-col gap-4 px-5 pb-4">
        <p class="text-muted-foreground text-xs">{{ explanation }}</p>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" for="return-review-note-mobile">Nota (opcional)</label>
          <Textarea
            id="return-review-note-mobile"
            v-model="note"
            rows="2"
            placeholder="Agrega una nota si lo necesitas"
            class="min-h-16 text-xs!"
            :disabled="isSubmitting"
          />
        </div>
        <div
          v-if="error"
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
        >
          <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
          <p>{{ error }}</p>
        </div>
        <div class="flex flex-col-reverse gap-2">
          <Button variant="outline" class="w-full" :disabled="isSubmitting" @click="open = false">
            Cancelar
          </Button>
          <Button
            class="w-full"
            :variant="approve ? 'default' : 'destructive'"
            :disabled="isSubmitting"
            @click="submit"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            {{ actionLabel }}
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
