<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Camera, ImagePlus, ImageOff, X } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCamera } from '@/composables/useCamera'
import { buildImageUrl, IMAGE_SIZES } from '@/services/cloudinary'

const props = defineProps({
  existingImageId: { type: String, default: null },
})

const modelValue = defineModel({ type: File, default: null })

const isDesktop = useMediaQuery('(min-width: 768px)')

const fileInput = ref(null)
const videoEl = ref(null)
const previewUrl = ref(null)
const isDragging = ref(false)
const isCameraOpen = ref(false)

const { isActive, cameraError, start, stop, capture } = useCamera()

const displayUrl = computed(() => {
  if (modelValue.value && previewUrl.value) {
    return previewUrl.value
  }

  if (props.existingImageId) {
    return buildImageUrl(props.existingImageId, IMAGE_SIZES.card)
  }

  return null
})

const hasImage = computed(() => !!displayUrl.value)

watch(cameraError, (msg) => {
  if (msg) {
    toast.error(msg)
  }
})

function revokePreview() {
  if (!previewUrl.value) {
    return
  }

  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

function setFile(file) {
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.error('El archivo seleccionado no es una imagen')
    return
  }

  const maxSizeBytes = 5 * 1024 * 1024

  if (file.size > maxSizeBytes) {
    toast.error('La imagen supera el límite permitido (5MB)')
    return
  }

  revokePreview()

  modelValue.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function removeImage() {
  modelValue.value = null
  revokePreview()
}

function openFileDialog() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]

  setFile(file)
  event.target.value = ''
}

function handleDragOver() {
  if (!isDesktop.value) {
    return
  }

  isDragging.value = true
}

function handleDragLeave() {
  if (!isDesktop.value) {
    return
  }

  isDragging.value = false
}

function handleDrop(event) {
  if (!isDesktop.value) {
    return
  }

  isDragging.value = false

  const file = event.dataTransfer.files?.[0]

  setFile(file)
}

async function openCamera() {
  isCameraOpen.value = true

  await nextTick()

  const started = await start(videoEl.value)

  if (!started) {
    return
  }
}

function closeCamera() {
  stop(videoEl.value)
  isCameraOpen.value = false
}

async function capturePhoto() {
  const file = await capture(videoEl.value, isDesktop.value)

  if (!file) {
    toast.error('La cámara todavía no está lista')
    return
  }

  setFile(file)
  closeCamera()
}

onBeforeUnmount(() => {
  stop()
  revokePreview()
})
</script>

<template>
  <div class="w-full">
    <!-- Mobile view -->
    <div v-if="!isDesktop" class="relative">
      <div
        class="border-muted-foreground/25 relative mx-auto flex aspect-square w-full max-w-52 items-center justify-center overflow-hidden rounded-lg border border-dashed transition-all duration-300"
        :class="
          hasImage
            ? 'border-border bg-muted border'
            : 'border-muted-foreground/25 border border-dashed'
        "
      >
        <!-- Image preview -->
        <template v-if="hasImage">
          <img
            :src="displayUrl"
            alt="Vista previa"
            class="h-full w-full object-cover"
            @click="openFileDialog"
          />
          <!-- hint -->
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-black/60 to-transparent px-3 pt-8 pb-2.5"
          >
            <span class="truncate pr-8 text-[11px] font-medium text-white">
              Toca la imagen para cambiar
            </span>
          </div>
          <!-- Remove image button -->
          <Button
            v-if="modelValue"
            type="button"
            variant="secondary"
            size="icon"
            class="absolute top-2 right-2 z-10 size-7 rounded-full shadow-md"
            aria-label="Descartar nueva imagen"
            @click.stop="removeImage"
          >
            <X class="size-4" />
          </Button>
        </template>
        <!-- Empty state -->
        <template v-else>
          <div class="text-muted-foreground flex flex-col items-center justify-center text-center">
            <ImagePlus class="size-8 stroke-[1.5]" />
            <p class="mt-2 text-xs leading-relaxed">
              <button
                type="button"
                class="text-primary hover:text-primary/80 text-[11px]"
                @click="openFileDialog"
              >
                Toca para seleccionar una imagen
              </button>
            </p>
          </div>
        </template>
        <!-- Camera button -->
        <Button
          type="button"
          :variant="hasImage ? 'secondary' : 'ghost'"
          size="icon"
          class="absolute right-2 bottom-2 z-10 size-7 rounded-full"
          :class="
            hasImage ? 'shadow-md' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          "
          aria-label="Tomar foto"
          @click.stop="openCamera"
        >
          <Camera class="size-4" />
        </Button>
      </div>
    </div>
    <!-- Desktop view-->
    <div v-else class="flex gap-4">
      <!-- Box 1: Image preview / empty state -->
      <div
        class="bg-muted/20 border-border relative flex h-40 w-1/2 items-center justify-center overflow-hidden rounded-xl border"
      >
        <template v-if="hasImage">
          <img :src="displayUrl" alt="Vista previa" class="h-full w-full object-cover" />
        </template>
        <template v-else>
          <div
            class="text-muted-foreground/40 flex flex-col items-center justify-center text-center"
          >
            <ImageOff class="size-8 stroke-[1.5]" />
            <span class="mt-1 text-xs font-medium">Sin imagen</span>
          </div>
        </template>
      </div>
      <!-- Box 2: Dropzone -->
      <div
        class="relative flex h-40 w-1/2 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors"
        :class="[
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-background',
        ]"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <ImagePlus class="text-muted-foreground size-8 stroke-[1.5]" />
        <p class="text-muted-foreground mt-2 mb-3 text-xs leading-relaxed">
          Arrastra una imagen aquí, o
          <button
            type="button"
            class="text-primary hover:text-primary/80 font-semibold"
            @click="openFileDialog"
          >
            haz clic para seleccionar
          </button>
        </p>
        <!-- Camera button -->
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="text-muted-foreground hover:bg-accent hover:text-foreground absolute right-2 bottom-2 size-7 rounded-full"
          @click="openCamera"
        >
          <Camera class="size-4" />
        </Button>
      </div>
    </div>
    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
    <!-- Camera Dialog -->
    <Dialog v-model:open="isCameraOpen" @update:open="!$event && closeCamera()">
      <DialogContent class="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tomar foto</DialogTitle>
          <DialogDescription>Captura una imagen del producto usando la cámara</DialogDescription>
        </DialogHeader>
        <p v-if="cameraError" class="text-destructive text-sm">
          {{ cameraError }}
        </p>
        <video
          ref="videoEl"
          autoplay
          muted
          playsinline
          class="aspect-4/3 max-h-[45vh] w-full rounded-lg bg-black object-cover"
          :class="{ 'scale-x-[-1]': isDesktop }"
        />
        <div class="flex flex-col-reverse gap-2 pt-2 lg:flex-row">
          <Button type="button" variant="outline" class="w-full sm:w-auto" @click="closeCamera">
            Cancelar
          </Button>
          <Button
            type="button"
            class="w-full sm:flex-1"
            :disabled="!isActive"
            @click="capturePhoto"
          >
            Capturar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
