<script setup>
import { computed, ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Copy, Check, Download, Printer } from '@lucide/vue'
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { formatDate } from '@/utils/date'
import { formatUnitStatus } from '@/utils/productUnits'
import { formatMoveReason } from '@/utils/inventoryMoves'
import { buildUnitUrl } from '@/utils/urls'

const props = defineProps({
  open: { type: Boolean, default: false },
  unit: { type: Object, default: null },
  product: { type: Object, default: null },
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
  if (!qrRef.value) {
    return
  }

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
      <DialogContent class="px-6 pt-4 pb-6 sm:max-w-sm">
        <DialogHeader class="gap-1">
          <DialogTitle class="text-sm">Código QR de unidad</DialogTitle>
          <DialogDescription class="text-xs">
            Vista previa del código QR y detalles de la unidad
          </DialogDescription>
        </DialogHeader>
        <div v-if="unit" class="flex flex-col gap-4">
          <!-- Product Name -->
          <div class="px-2 text-center">
            <Tooltip>
              <TooltipTrigger as-child>
                <h3 class="line-clamp-2 cursor-default text-[13px] leading-tight font-medium">
                  {{ product?.name || 'Sin nombre' }}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p class="max-w-xs text-wrap">{{ product?.name || 'Sin nombre' }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- QR code -->
          <div class="border-border mx-auto rounded-sm border-2 bg-white p-2 shadow-sm">
            <QrcodeVue
              ref="qrRef"
              :value="buildUnitUrl(unit.id)"
              :size="180"
              level="H"
              render-as="svg"
              background="#ffffff"
              class="block h-auto w-full"
            />
          </div>
          <!-- Info unit -->
          <div class="my-1 grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm border p-4 text-xs">
            <!-- Unit -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Unidad:</span>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    @click="copyId"
                    class="bg-muted/80 hover:bg-muted active:bg-muted/60 group flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-xs shadow-sm transition-colors"
                  >
                    <span :class="{ 'text-emerald-500': copied, 'text-foreground': !copied }">
                      {{ unit.id.slice(0, 8) }}
                    </span>
                    <!-- Feedback -->
                    <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-500" />
                    <Copy v-else class="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ copied ? '¡Copiado!' : 'Copiar ID completo' }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Status -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Estado:</span>
              <Badge
                variant="outline"
                class="shrink-0 text-[11px]"
                :class="STATUS_STYLES[unit.status] ?? ''"
              >
                {{ formatUnitStatus(unit.status) }}
              </Badge>
            </div>
            <!-- Entry -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Ingreso:</span>
              <span class="truncate">{{ formatDate(unit.created_at) }}</span>
            </div>
            <!-- Origin -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Origen:</span>
              <span
                class="truncate"
                :title="unit.origin_reason ? formatMoveReason(unit.origin_reason) : 'Sin origen'"
              >
                {{ unit.origin_reason ? formatMoveReason(unit.origin_reason) : 'Sin origen' }}
              </span>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="flex w-full gap-2">
            <Button variant="outline" size="sm" class="flex-1" @click="handleReprint">
              <Printer class="h-4 w-4" />
              <span class="text-xs">Reimprimir</span>
            </Button>
            <Button size="sm" class="flex-1" @click="downloadQr">
              <Download class="h-4 w-4" />
              <span class="text-xs">Descargar</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <!-- Mobile view -->
    <Drawer v-else v-model:open="openModel">
      <DrawerContent>
        <DrawerHeader class="gap-1 px-6">
          <DrawerTitle class="text-sm">Código QR de unidad</DrawerTitle>
          <DrawerDescription class="text-xs">
            Vista previa del código QR y detalles de la unidad
          </DrawerDescription>
        </DrawerHeader>
        <div v-if="unit" class="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-6 pt-2 pb-6">
          <!-- Product name -->
          <div class="-mt-2 px-2 text-center">
            <Tooltip>
              <TooltipTrigger as-child>
                <h3 class="line-clamp-2 cursor-default text-[13px] leading-tight font-semibold">
                  {{ product?.name || 'Sin nombre' }}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p class="max-w-xs text-wrap">{{ product?.name || 'Sin nombre' }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- QR code -->
          <div class="border-border mx-auto rounded-lg border-2 bg-white p-2 shadow-sm">
            <QrcodeVue
              ref="qrRef"
              :value="buildUnitUrl(unit.id)"
              :size="180"
              level="H"
              render-as="svg"
              background="#ffffff"
              class="block h-auto w-full"
            />
          </div>
          <!-- Info unit -->
          <div
            class="bg-muted/40 my-1 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border p-3 text-xs"
          >
            <!-- Unit -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Unidad:</span>
              <button
                @click="copyId"
                class="bg-muted/80 hover:bg-muted active:bg-muted/60 flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 font-mono text-xs shadow-sm transition-colors"
              >
                <span :class="{ 'text-emerald-500': copied, 'text-foreground': !copied }">
                  {{ unit.id.slice(0, 8) }}
                </span>
                <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5" />
              </button>
            </div>
            <!-- Status -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Estado:</span>
              <Badge
                variant="outline"
                class="shrink-0 text-[11px]"
                :class="STATUS_STYLES[unit.status] ?? ''"
              >
                {{ formatUnitStatus(unit.status) }}
              </Badge>
            </div>
            <!-- Entry -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Ingreso:</span>
              <span class="truncate">{{ formatDate(unit.created_at) }}</span>
            </div>
            <!-- Origin -->
            <div class="flex min-w-0 items-center gap-2">
              <span class="text-muted-foreground whitespace-nowrap">Origen:</span>
              <span
                class="truncate"
                :title="unit.origin_reason ? formatMoveReason(unit.origin_reason) : 'Sin origen'"
              >
                {{ unit.origin_reason ? formatMoveReason(unit.origin_reason) : 'Sin origen' }}
              </span>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="flex flex-col items-center justify-between gap-2">
            <Button class="w-full" @click="downloadQr">
              <Download class="h-4 w-4" />
              <span>Descargar</span>
            </Button>
            <Button variant="outline" class="w-full" @click="handleReprint">
              <Printer class="h-4 w-4" />
              <span>Reimprimir</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  </TooltipProvider>
</template>
