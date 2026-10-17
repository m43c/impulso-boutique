<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useMediaQuery } from '@vueuse/core'
import { CheckCircle2, Printer } from '@lucide/vue'
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

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    default: null,
  },
  unitIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:open'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const openModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const count = computed(() => props.unitIds.length)
const productName = computed(() => props.product?.name ?? '')

const title = computed(() =>
  count.value === 1 ? '1 unidad registrada' : `${count.value} unidades registradas`,
)

function handlePrint() {
  window.print()
}
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="openModel">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-xl">
      <DialogHeader class="border-border/60 border-b px-6 pt-6 pb-4">
        <!-- Title -->
        <DialogTitle class="flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{{ title }}</span>
        </DialogTitle>
        <!-- Product name -->
        <DialogDescription v-if="productName">
          {{ productName }}
        </DialogDescription>
      </DialogHeader>
      <!-- QR codes -->
      <div class="flex flex-col gap-4 p-4 px-6">
        <p class="text-muted-foreground text-xs">Imprime las etiquetas y pégalas en cada prenda</p>
        <div class="max-h-[55vh] overflow-y-auto pr-1">
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="id in unitIds"
              :key="id"
              class="border-border/60 flex flex-col items-center rounded-lg border p-3"
            >
              <QrcodeVue :value="id" :size="160" level="H" render-as="svg" class="h-auto w-full" />
              <p
                class="text-muted-foreground mt-2 w-full truncate text-center font-mono text-[11px]"
              >
                {{ id.slice(0, 8) }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- Action buttons -->
      <div class="border-border/60 flex shrink-0 justify-end gap-2 border-t p-4 px-6">
        <Button variant="outline" @click="openModel = false">Cerrar</Button>
        <Button @click="handlePrint">
          <Printer class="h-4 w-4" />
          Imprimir etiquetas
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent class="flex flex-col">
      <DrawerHeader class="border-border/60 border-b px-6 pb-4 text-left">
        <!-- Title -->
        <DrawerTitle class="flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{{ title }}</span>
        </DrawerTitle>
        <!-- Product name -->
        <DrawerDescription v-if="productName">
          {{ productName }}
        </DrawerDescription>
      </DrawerHeader>
      <!-- QR codes -->
      <div class="flex min-h-0 flex-1 flex-col gap-4 px-6 pt-4 pb-6">
        <p class="text-muted-foreground text-xs">Imprime las etiquetas y pégalas en cada prenda</p>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="id in unitIds"
              :key="id"
              class="border-border/60 flex flex-col items-center rounded-lg border p-3"
            >
              <QrcodeVue :value="id" :size="160" level="H" render-as="svg" class="h-auto w-full" />
              <p
                class="text-muted-foreground mt-2 w-full truncate text-center font-mono text-[11px]"
              >
                {{ id.slice(0, 8) }}
              </p>
            </div>
          </div>
        </div>
        <!-- Action buttons -->
        <div class="flex shrink-0 flex-col-reverse gap-2">
          <Button variant="outline" class="w-full" @click="openModel = false">Cerrar</Button>
          <Button class="w-full" @click="handlePrint">
            <Printer class="h-4 w-4" />
            Imprimir etiquetas
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
  <!-- Print -->
  <Teleport to="body">
    <div class="product-labels-print">
      <div v-for="id in unitIds" :key="id" class="product-label-cell">
        <QrcodeVue :value="id" :size="200" level="H" render-as="svg" />
        <span class="product-label-id">{{ id.slice(0, 8) }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style>
.product-labels-print {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }

  .product-labels-print,
  .product-labels-print * {
    visibility: visible;
  }

  .product-labels-print {
    display: grid;
    position: absolute;
    inset: 0;
    width: 100%;
    padding: 10mm;
    grid-template-columns: repeat(4, 1fr);
    gap: 4mm;
    background: #fff;
    color: #000;
    align-content: start; 
  }

  .product-label-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 4mm;
    height: 50mm;
    border: 1px solid #e5e5e5;
    break-inside: avoid;
    page-break-inside: avoid;
    box-sizing: border-box;
  }

  .product-label-cell svg {
    width: 100%;
    height: auto;
  }

  .product-label-id {
    margin-top: 2mm;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 10pt;
    color: #000;
  }

  @page {
    size: A4;
    margin: 0;
  }
}

@media print and (max-width: 640px) {
  .product-labels-print {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
