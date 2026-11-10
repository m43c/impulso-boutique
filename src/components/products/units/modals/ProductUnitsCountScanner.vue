<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Camera, FlipHorizontal, Loader2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQrScanner } from '@/composables/useQrScanner'

const props = defineProps({
  knownUnitIds: { type: Array, default: () => [] },
  scannedIds: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['detected'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const { READER_ELEMENT_ID, isScanning, scanError, cameras, selectedCameraId, startScan, stopScan } =
  useQrScanner()

const isStarting = ref(false)
const isMirrored = ref(false)
const validationError = ref(null)

let validationTimeout = null

function showValidationError(message) {
  validationError.value = message
  clearTimeout(validationTimeout)
  validationTimeout = setTimeout(() => {
    validationError.value = null
  }, 3000)
}

function handleDetected(unitId) {
  validationError.value = null

  if (!props.knownUnitIds.includes(unitId)) {
    showValidationError('Esta unidad no pertenece a este producto')
    return
  }

  if (props.scannedIds.includes(unitId)) {
    return
  }

  toast.success(`Unidad ${unitId.slice(0, 8)} escaneada`, { duration: 1500 })

  if (navigator.vibrate) {
    navigator.vibrate(50)
  }

  emit('detected', unitId)
}

async function start() {
  if (isScanning.value || isStarting.value) return

  isStarting.value = true
  scanError.value = null
  validationError.value = null

  await nextTick()
  await nextTick()

  await startScan(handleDetected, { continuous: true })
  isStarting.value = false
}

async function handleRetry() {
  await stopScan()
  await start()
}

onMounted(async () => {
  await start()
})
</script>

<template>
  <div class="flex flex-col gap-3 px-6">
    <!-- Error message -->
    <Alert v-if="validationError" variant="destructive">
      <AlertDescription class="lg:text-xs">{{ validationError }}</AlertDescription>
    </Alert>
    <!-- Progress -->
    <div class="flex items-center justify-between text-xs">
      <span class="text-muted-foreground">Escaneadas</span>
      <span class="font-semibold">{{ scannedIds.length }} de {{ total }}</span>
    </div>
    <!-- QR scanner -->
    <div
      class="bg-muted/40 relative mx-auto flex aspect-square w-full max-w-70 items-center justify-center overflow-hidden rounded-md lg:h-64 lg:w-64"
    >
      <div :id="READER_ELEMENT_ID" class="qr-reader w-full" :class="{ mirrored: isMirrored }" />
      <!-- Mirror toggle (desktop only) -->
      <button
        v-if="isDesktop"
        type="button"
        class="bg-background/60 hover:bg-background/90 text-foreground absolute top-2 right-2 z-20 rounded-md p-1.5 backdrop-blur-sm transition-colors"
        title="Alternar efecto espejo"
        @click="isMirrored = !isMirrored"
      >
        <FlipHorizontal class="h-4 w-4" />
      </button>
      <!-- Starting overlay -->
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
    <!-- Camera selector -->
    <div v-if="cameras.length > 1" class="flex items-center gap-2 text-xs">
      <label for="count-qr-camera" class="text-muted-foreground shrink-0">Cámara:</label>
      <Select v-model="selectedCameraId" @update:model-value="handleRetry">
        <SelectTrigger id="count-qr-camera" class="h-7! min-w-0 flex-1 rounded-sm text-xs">
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
      <div class="min-w-0 flex-1">
        <p>{{ scanError }}</p>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" @click="handleRetry">
          Reintentar
        </Button>
      </div>
    </div>
  </div>
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
