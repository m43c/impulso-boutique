<script setup>
import ProductImage from '@/components/products/ProductImage.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { shortId } from '@/utils/sales'

defineProps({
  lines: { type: Array, default: () => [] },
})

function variantLabel(line) {
  return [line.color, line.size].filter(Boolean).join(' · ')
}
</script>

<template>
  <div v-if="lines.length" class="flex flex-col gap-3">
    <div v-for="line in lines" :key="line.unit_id" class="flex items-start gap-3">
      <ProductImage
        :public-id="line.image_public_id"
        :alt="line.product_name"
        :size="IMAGE_SIZES.thumb"
        image-class="h-11 w-11 shrink-0 rounded-md object-cover"
        fallback-class="bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
      />
      <div class="-mt-0.5 min-w-0 flex-1">
        <p class="truncate text-xs font-medium">{{ line.product_name }}</p>
        <p v-if="variantLabel(line)" class="text-muted-foreground truncate text-xs">
          {{ variantLabel(line) }}
        </p>
        <p class="text-muted-foreground font-mono text-[11px]">{{ shortId(line.unit_id) }}</p>
      </div>
      <span class="-mt-0.5 shrink-0 text-sm font-medium tabular-nums">
        {{ formatCurrency(line.unit_price) }}
      </span>
    </div>
  </div>
  <p v-else class="text-muted-foreground py-6 text-center text-xs">Sin prendas registradas</p>
</template>
