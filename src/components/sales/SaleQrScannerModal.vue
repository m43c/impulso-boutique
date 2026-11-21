<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useSaleStore } from '@/stores/sale'
import { useMediaQuery } from '@vueuse/core'
import { Camera, Check, CircleAlert, FlipHorizontal, Loader2 } from '@lucide/vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQrScanner } from '@/composables/useQrScanner'
import { getSaleErrorMessage } from '@/utils/saleErrors'
import { shortId } from '@/utils/sales'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open'])

const isDesktop = useMediaQuery('(min-width: 768px)')
const saleStore = useSaleStore()

const { READER_ELEMENT_ID, isScanning, scanError, cameras, selectedCameraId, startScan, stopScan } =
  useQrScanner()

const isStarting = ref(false)
const isMirrored = ref(false)
const feedback = ref(null)

let feedbackTimeout = null

const openModel = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

function showFeedback(type, message) {
  feedback.value = { type, message }
  clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => {
    feedback.value = null
  }, 3000)
}

async function handleDetected(unitId) {
  try {
    const result = await saleStore.addUnitByCode(unitId)

    if (result.ok) {
      showFeedback('success', `Unidad ${shortId(unitId)} agregada`)

      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } else {
      showFeedback('error', result.message)
    }
  } catch (error) {
    showFeedback('error', getSaleErrorMessage(error, 'No se pudo agregar la prenda'))
  }
}

async function start() {
  if (isScanning.value || isStarting.value) {
    return
  }

  isStarting.value = true
  scanError.value = null
  feedback.value = null

  await nextTick()
  await nextTick()

  await startScan(handleDetected, { continuous: true })
  isStarting.value = false
}

async function stop() {
  await stopScan()
  feedback.value = null
}

async function handleRetry() {
  await stopScan()
  await start()
}

let openToken = 0

watch(
  () => props.open,
  async (open) => {
    const token = ++openToken

    if (open) {
      await start()

      if (token !== openToken || !props.open) {
        await stop()
      }
    } else {
      await stop()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimeout(feedbackTimeout)
})
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="openModel">
    <DialogContent class="pt-4 sm:max-w-sm">
      <DialogHeader class="gap-0.5">
        <DialogTitle class="text-sm">Escanear prenda</DialogTitle>
        <DialogDescription class="text-xs">
          Apunta la cámara a la etiqueta de la prenda
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <!-- Progress -->
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="text-muted-foreground">En la venta</span>
          <span class="font-semibold">{{ saleStore.count }} prendas</span>
        </div>
        <!-- QR scanner -->
        <div
          class="bg-muted/40 relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-md"
        >
          <div :id="READER_ELEMENT_ID" class="qr-reader w-full" :class="{ mirrored: isMirrored }" />
          <button
            type="button"
            class="bg-background/60 hover:bg-background/90 text-foreground absolute top-1.5 right-1.5 z-20 rounded-md p-1.5 backdrop-blur-sm transition-colors"
            title="Alternar efecto espejo"
            @click="isMirrored = !isMirrored"
          >
            <FlipHorizontal class="h-3.5 w-3.5" />
          </button>
          <div
            v-if="isStarting"
            class="bg-background/80 absolute inset-0 z-10 flex items-center justify-center gap-2 text-xs"
          >
            <Loader2 class="h-5 w-5 animate-spin" />
            <span class="text-muted-foreground">Iniciando cámara…</span>
          </div>
        </div>
        <!-- Searching -->
        <div
          v-if="isScanning && !scanError"
          class="text-muted-foreground flex items-center justify-center gap-2 text-xs"
        >
          <Camera class="h-4 w-4" />
          Buscando código QR…
        </div>
        <!-- Feedback -->
        <div
          v-if="feedback"
          class="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
          :class="
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          "
        >
          <Check v-if="feedback.type === 'success'" class="size-4 shrink-0" />
          <CircleAlert v-else class="size-4 shrink-0" />
          <span class="min-w-0">{{ feedback.message }}</span>
        </div>
        <!-- Camera selector -->
        <div v-if="cameras.length > 1" class="flex items-center gap-2 text-xs">
          <label for="sale-qr-camera-desktop" class="text-muted-foreground shrink-0">Cámara:</label>
          <Select v-model="selectedCameraId" @update:model-value="handleRetry">
            <SelectTrigger
              id="sale-qr-camera-desktop"
              class="h-7! min-w-0 flex-1 rounded-sm text-xs"
            >
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="cam in cameras" :key="cam.id" :value="cam.id">
                <span class="text-xs">{{ cam.label || `Cámara ${cam.id.slice(0, 8)}` }}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <!-- Camera error -->
        <div
          v-if="scanError"
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 py-2 text-xs"
        >
          <div class="min-w-0 flex-1 flex gap-2 items-center">
            <p>{{ scanError }}</p>
            <Button
              variant="outline"
              size="sm"
              class="h-auto px-2 py-1 text-xs"
              @click="handleRetry"
            >
              Reintentar
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" class="w-full" @click="openModel = false">
          <span class="text-xs">Listo</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent>
      <DrawerHeader class="gap-0 px-6 pb-2 text-left">
        <DrawerTitle class="text-sm">Escanear prenda</DrawerTitle>
        <DrawerDescription class="text-xs">
          Apunta la cámara a la etiqueta de la prenda
        </DrawerDescription>
      </DrawerHeader>
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6 pt-2">
        <!-- Progress -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">En la venta</span>
          <span class="font-semibold">{{ saleStore.count }} prendas</span>
        </div>
        <!-- QR scanner -->
        <div
          class="bg-muted/40 relative mx-auto flex aspect-square w-full max-w-70 shrink-0 items-center justify-center overflow-hidden rounded-sm border"
        >
          <div :id="READER_ELEMENT_ID" class="qr-reader w-full" />
          <div
            v-if="isStarting"
            class="bg-background/80 absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm"
          >
            <Loader2 class="h-5 w-5 animate-spin" />
            <span class="text-muted-foreground text-xs">Iniciando cámara…</span>
          </div>
        </div>
        <!-- Searching -->
        <div
          v-if="isScanning && !scanError"
          class="text-muted-foreground flex items-center justify-center gap-2 text-xs"
        >
          <Camera class="h-4 w-4" />
          Buscando código QR…
        </div>
        <!-- Feedback -->
        <div
          v-if="feedback"
          class="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
          :class="
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          "
        >
          <Check v-if="feedback.type === 'success'" class="size-4 shrink-0" />
          <CircleAlert v-else class="size-4 shrink-0" />
          <span class="min-w-0">{{ feedback.message }}</span>
        </div>
        <!-- Camera selector -->
        <div v-if="cameras.length > 1" class="flex items-center gap-2 text-xs">
          <label for="sale-qr-camera-mobile" class="text-muted-foreground shrink-0">Cámara:</label>
          <Select v-model="selectedCameraId" @update:model-value="handleRetry">
            <SelectTrigger id="sale-qr-camera-mobile" class="h-7! min-w-0 flex-1 text-xs">
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="cam in cameras" :key="cam.id" :value="cam.id">
                <span class="text-xs">{{ cam.label || `Cámara ${cam.id.slice(0, 8)}` }}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <!-- Camera error --> 
        <div
          v-if="scanError"
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 py-2 text-xs"
        >
          <div class="min-w-0 flex-1 flex gap-2 items-center">
            <p>{{ scanError }}</p>
            <Button
              variant="outline"
              size="sm"
              class="h-auto px-2 py-1 text-xs"
              @click="handleRetry"
            >
              Reintentar
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" class="w-full" @click="openModel = false">Listo</Button>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<style>
.qr-reader video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  border-radius: 0.5rem;
  transition: transform 0.3s ease;
}

.qr-reader.mirrored video {
  transform: scaleX(-1);
}

.qr-reader img {
  display: none;
}
</style>
