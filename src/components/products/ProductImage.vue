<script setup>
import { ref, watch } from 'vue'
import { ImageOff } from '@lucide/vue'
import { buildImageUrl, IMAGE_SIZES } from '@/services/cloudinary'

const props = defineProps({
  publicId: {
    type: String,
    default: null,
  },
  alt: {
    type: String,
    default: '',
  },
  size: {
    type: [String, Object],
    default: IMAGE_SIZES.thumb,
  },
  imageClass: {
    type: String,
    default: 'h-10 w-10 shrink-0 rounded-md object-cover',
  },
  fallbackClass: {
    type: String,
    default: 'bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
  },
  iconClass: {
    type: String,
    default: 'text-muted-foreground h-4 w-4',
  },
})

const hasError = ref(false)

watch(
  () => props.publicId,
  () => {
    hasError.value = false
  },
)
</script>

<template>
  <img
    v-if="publicId && !hasError"
    :src="buildImageUrl(publicId, size)"
    :alt="alt"
    loading="lazy"
    decoding="async"
    :class="imageClass"
    @error="hasError = true"
  />
  <div v-else :class="fallbackClass">
    <ImageOff :class="iconClass" />
  </div>
</template>
