<script setup>
import { computed, ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { toast } from 'vue-sonner'
import { useMediaQuery } from '@vueuse/core'
import { Copy, Download, Printer } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { formatDate } from '@/utils/date'
import { formatUnitStatus } from '@/utils/productUnits'
import { formatMoveReason } from '@/utils/inventoryMoves'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  unit: {
    type: Object,
    default: null,
  },
  product: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'reprint'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const qrRef = ref(null)
const copied = ref(false)

const openModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const STATUS_STYLES = {
  available: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  sold: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  returned: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  unavailable: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
}

function downloadQr() {
  if (!qrRef.value) return

  const svgElement = qrRef.value.$el || qrRef.value
  const svgString = new XMLSerializer().serializeToString(svgElement)
  const svgBase64 = btoa(unescape(encodeURIComponent(svgString)))
  const dataUrl = `data:image/svg+xml;base64,${svgBase64}`

  const img = new Image()

  img.onload = () => {
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)

      const margin = size * 0.04
      const qrSize = size - margin * 2

      ctx.drawImage(img, margin, margin, qrSize, qrSize)

      canvas.toBlob((blob) => {
        if (!blob) {
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')

        a.href = url
        a.download = `QR-${props.unit?.id.slice(0, 8)}.png`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
      }, 'image/png')
    }
  }

  img.src = dataUrl
}

function handleReprint() {
  emit('reprint', props.unit)
  openModel.value = false
}

async function copyId() {
  try {
    await navigator.clipboard.writeText(props.unit.id)
    copied.value = true
    toast.success('ID de unidad copiado')
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    toast.error('No se pudo copiar el ID')
  }
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <!-- Desktop view -->
    <Dialog v-if="isDesktop" v-model:open="openModel">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Código QR de unidad</DialogTitle>
          <DialogDescription class="sr-only">
            Vista previa del código QR y detalles de la unidad
          </DialogDescription>
        </DialogHeader>
        <!-- QR -->
        <div v-if="unit" class="flex flex-col gap-4 pt-2">
          <div class="border-border mx-auto rounded-lg border-2 bg-white p-2 shadow-sm">
            <QrcodeVue
              ref="qrRef"
              :value="unit.id"
              :size="240"
              level="H"
              render-as="svg"
              background="#ffffff"
              class="block h-auto w-full"
            />
          </div>
          <div class="bg-muted/40 flex w-full flex-col gap-2 rounded-lg p-4 text-xs">
            <!-- Product name -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Producto:</span>
              <Tooltip>
                <TooltipTrigger as-child>
                  <span class="max-w-50 truncate text-right font-medium">
                    {{ product?.name || 'Sin nombre' }}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ product?.name || 'Sin nombre' }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Unit -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Unidad:</span>
              <div class="flex items-center gap-1">
                <span class="font-mono font-medium">{{ unit.id.slice(0, 8) }}</span>
                <!-- Copy button -->
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="ml-1 h-6 w-6" @click="copyId">
                      <Copy class="h-3 w-3" :class="{ 'text-emerald-500': copied }" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ copied ? '¡Copiado!' : 'Copiar ID completo' }}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <!-- Status -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Estado:</span>
              <Badge
                variant="outline"
                class="px-2 pt-0 text-[10px]"
                :class="STATUS_STYLES[unit.status] ?? ''"
              >
                {{ formatUnitStatus(unit.status) }}
              </Badge>
            </div>
            <!-- Entry -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Ingreso:</span>
              <span class="font-medium">{{ formatDate(unit.created_at) }}</span>
            </div>
            <!-- Origin -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Origen:</span>
              <span class="font-medium">
                {{ unit.origin_reason ? formatMoveReason(unit.origin_reason) : 'Sin origen' }}
              </span>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="flex w-full gap-2">
            <Button variant="outline" class="flex-1" @click="handleReprint">
              <Printer class="h-4 w-4" />
              Reimprimir
            </Button>
            <Button class="flex-1" @click="downloadQr">
              <Download class="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <!-- Mobile view -->
    <Drawer v-else v-model:open="openModel">
      <DrawerContent>
        <DrawerHeader class="px-6">
          <DrawerTitle class="flex">Código QR de unidad</DrawerTitle>
        </DrawerHeader>
        <!-- QR -->
        <div v-if="unit" class="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-6 pt-2 pb-6">
          <div class="border-border mx-auto rounded-lg border-2 bg-white p-2 shadow-sm">
            <QrcodeVue
              ref="qrRef"
              :value="unit.id"
              :size="200"
              level="H"
              render-as="svg"
              background="#ffffff"
              class="block h-auto w-full"
            />
          </div>
          <div class="bg-muted/40 flex w-full flex-col gap-2 rounded-lg p-4 text-xs">
            <!-- Product name -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Producto:</span>
              <Tooltip>
                <TooltipTrigger as-child>
                  <span class="max-w-50 truncate text-right font-medium">
                    {{ product?.name || 'Sin nombre' }}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ product?.name || 'Sin nombre' }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Unit -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Unidad:</span>
              <div class="flex items-center gap-1">
                <span class="font-mono font-medium">{{ unit.id.slice(0, 8) }}</span>
                <!-- Copy button -->
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="ml-1 h-6 w-6" @click="copyId">
                      <Copy class="h-3 w-3" :class="{ 'text-emerald-500': copied }" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ copied ? '¡Copiado!' : 'Copiar ID completo' }}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <!-- Status -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Estado:</span>
              <Badge
                variant="outline"
                class="px-2 pt-0.5 text-[11px]"
                :class="STATUS_STYLES[unit.status] ?? ''"
              >
                {{ formatUnitStatus(unit.status) }}
              </Badge>
            </div>
            <!-- Entry -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Ingreso:</span>
              <span class="font-medium">{{ formatDate(unit.created_at) }}</span>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="flex flex-col items-center justify-between gap-2">
            <Button variant="outline" class="w-full" @click="handleReprint">
              <Printer class="h-4 w-4" />
              Reimprimir
            </Button>
            <Button class="w-full" @click="downloadQr">
              <Download class="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  </TooltipProvider>
</template>
