<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Camera, Keyboard, Loader2, FlipHorizontal } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'detected'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const {
  READER_ELEMENT_ID,
  isScanning,
  scanError,
  cameras,
  selectedCameraId,
  startScan,
  stopScan,
  validateManualInput,
} = useQrScanner()

const isMirrored = ref(false)

const openModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const isStarting = ref(false)
const showManual = ref(false)
const manualId = ref('')
const manualError = ref(null)

async function handleOpenChange(open) {
  openModel.value = open
}

async function openScanner() {
  if (isScanning.value || isStarting.value) {
    return
  }

  isStarting.value = true
  scanError.value = null
  showManual.value = false
  manualId.value = ''
  manualError.value = null

  await nextTick()
  await nextTick()

  await startScan(handleDetected)
  isStarting.value = false
}

async function closeScanner() {
  await stopScan()
}

function handleDetected(unitId) {
  emit('detected', unitId)
  openModel.value = false
}

async function handleRetry() {
  await stopScan()
  await openScanner()
}

function handleManualSubmit() {
  manualError.value = null

  const result = validateManualInput(manualId.value)

  if (!result.ok) {
    manualError.value = result.error
    return
  }

  handleDetected(result.value)
}

let openToken = 0

watch(
  () => props.open,
  async (open) => {
    const token = ++openToken

    if (open) {
      await openScanner()

      if (token !== openToken || !props.open) {
        await closeScanner()
      }
    } else {
      await closeScanner()
    }
  },
  { immediate: true },
)
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" :open="openModel" @update:open="handleOpenChange">
    <DialogContent class="pt-4 sm:max-w-sm">
      <DialogHeader class="gap-0.5">
        <DialogTitle class="text-sm">Escanear código QR</DialogTitle>
        <DialogDescription class="text-xs">
          Apunta la cámara a la etiqueta de la unidad
        </DialogDescription>
      </DialogHeader>
      <!-- QR scanner -->
      <div class="flex flex-col gap-3">
        <div
          class="bg-muted/40 relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-md"
        >
          <div :id="READER_ELEMENT_ID" class="qr-reader w-full" :class="{ mirrored: isMirrored }" />
          <!-- Botón de voltear -->
          <button
            @click="isMirrored = !isMirrored"
            class="bg-background/60 hover:bg-background/90 text-foreground absolute top-2 right-2 z-20 rounded-md p-1.5 backdrop-blur-sm transition-colors"
            title="Alternar efecto espejo"
            type="button"
          >
            <FlipHorizontal class="h-4 w-4" />
          </button>
          <div
            v-if="isStarting"
            class="bg-background/80 absolute inset-0 z-10 flex items-center justify-center gap-2 text-xs"
          >
            <Loader2 class="h-5 w-5 animate-spin" />
            <span class="text-muted-foreground">Iniciando cámara…</span>
          </div>
        </div>
        <!-- Searching... -->
        <div
          v-if="isScanning && !scanError"
          class="text-muted-foreground flex items-center justify-center gap-2 text-xs"
        >
          <Camera class="h-4 w-4" />
          Buscando código QR…
        </div>
        <!-- Camera list -->
        <div v-if="cameras.length > 1" class="flex items-center gap-2 text-xs">
          <label for="qr-camera-desktop" class="text-muted-foreground shrink-0">Cámara:</label>

          <Select v-model="selectedCameraId" @update:model-value="handleRetry">
            <SelectTrigger id="qr-camera-desktop" class="h-7! min-w-0 flex-1 rounded-sm text-xs">
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
        <!-- Manual search -->
        <div class="mt-1 border-t pt-1.5">
          <Button
            variant="ghost"
            size="sm"
            class="w-full text-xs"
            @click="showManual = !showManual"
          >
            <Keyboard class="h-4 w-4" />
            {{ showManual ? 'Ocultar ingreso manual' : 'Ingresar ID manualmente' }}
          </Button>
          <div v-if="showManual" class="mt-2 flex flex-col gap-2">
            <Input
              v-model="manualId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="h-8 font-mono text-xs!"
            />
            <p v-if="manualError" class="text-destructive text-xs">{{ manualError }}</p>
            <Button size="sm" class="w-full" @click="handleManualSubmit">
              <span class="text-xs">Buscar unidad</span>
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else :open="openModel" @update:open="handleOpenChange">
    <DrawerContent>
      <DrawerHeader class="gap-0 px-6 pb-2 text-left">
        <DrawerTitle>Escanear código QR</DrawerTitle>
        <DrawerDescription>Apunta la cámara a la etiqueta de la unidad</DrawerDescription>
      </DrawerHeader>
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6 pt-2">
        <!-- QR scanner -->
        <div
          class="bg-muted/40 relative mx-auto flex aspect-square w-full max-w-70 shrink-0 overflow-hidden rounded-sm border"
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
        <!-- Searching... -->
        <div
          v-if="isScanning && !scanError"
          class="text-muted-foreground flex items-center justify-center gap-2 text-xs"
        >
          <Camera class="h-4 w-4" />
          Buscando código QR…
        </div>
        <!-- Camera list -->
        <div v-if="cameras.length > 1" class="flex items-center gap-2 text-xs">
          <label for="qr-camera-mobile" class="text-muted-foreground shrink-0">Cámara:</label>

          <Select v-model="selectedCameraId" @update:model-value="handleRetry">
            <SelectTrigger id="qr-camera-mobile" class="h-9 min-w-0 flex-1 text-sm">
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="cam in cameras" :key="cam.id" :value="cam.id">
                {{ cam.label || `Cámara ${cam.id.slice(0, 8)}` }}
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
        <!-- Manual search -->
        <div class="border-t pt-0.5">
          <Button
            variant="ghost"
            size="sm"
            class="w-full text-xs"
            @click="showManual = !showManual"
          >
            <Keyboard class="h-4 w-4" />
            {{ showManual ? 'Ocultar ingreso manual' : 'Ingresar ID manualmente' }}
          </Button>
          <div v-if="showManual" class="mt-2 flex flex-col gap-2">
            <Input
              v-model="manualId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="font-mono lg:text-xs"
            />
            <p v-if="manualError" class="text-destructive text-xs">{{ manualError }}</p>
            <Button size="sm" class="mt-0.5 w-full" @click="handleManualSubmit">
              Buscar unidad
            </Button>
          </div>
        </div>
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
