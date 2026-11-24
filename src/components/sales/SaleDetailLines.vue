<script setup>
import { Button } from '@/components/ui/button'
import ProductImage from '@/components/products/ProductImage.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import {
  formatReplacedUnit,
  formatReturnReason,
  formatReturnReplacement,
  formatReturnType,
} from '@/utils/returns'
import { shortId } from '@/utils/sales'

defineProps({
  lines: { type: Array, default: () => [] },
  canCreateReturn: { type: Boolean, default: false },
})

const emit = defineEmits(['return-line'])

function variantLabel(line) {
  return [line.color, line.size].filter(Boolean).join(' · ')
}
</script>

<template>
  <div v-if="lines.length" class="flex flex-col gap-3">
    <div v-for="line in lines" :key="line.unit_id" class="flex flex-col gap-1">
      <div class="flex items-start gap-3">
        <ProductImage
          :public-id="line.image_public_id"
          :alt="line.product_name"
          :size="IMAGE_SIZES.thumb"
          image-class="h-12 w-12 shrink-0 rounded-md object-cover"
          fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
        />
        <div class="-mt-0.5 min-w-0 flex-1">
          <p class="truncate text-xs font-medium">{{ line.product_name }}</p>
          <p v-if="variantLabel(line)" class="text-muted-foreground mt-1.5 truncate text-xs">
            {{ variantLabel(line) }}
          </p>
          <p class="text-muted-foreground font-mono text-[11px]">{{ shortId(line.unit_id) }}</p>
        </div>
        <div class="-mt-0.5 flex shrink-0 flex-col items-end gap-1">
          <span class="text-sm font-medium tabular-nums">
            {{ formatCurrency(line.unit_price) }}
          </span>
          <Button
            v-if="canCreateReturn && line.can_return"
            size="sm"
            class="h-6 rounded-sm px-2 lg:text-[11px]"
            @click="emit('return-line', line)"
          >
            {{ line.is_replacement_line ? 'Cambiar otra vez' : 'Devolver' }}
          </Button>
        </div>
      </div>
      <div v-if="line.return_info" class="flex flex-col">
        <span class="text-[11px] font-medium text-amber-500 dark:text-amber-500">
          Devuelta · {{ formatReturnType(line.return_info.type) }}
        </span>
        <span class="text-muted-foreground text-[11px]">
          Motivo: {{ formatReturnReason(line.return_info.reason) }}
        </span>
        <span
          v-if="formatReturnReplacement(line.return_info)"
          class="text-muted-foreground text-[11px]"
        >
          {{ formatReturnReplacement(line.return_info) }}
        </span>
      </div>
      <p v-if="formatReplacedUnit(line.replaced_info)" class="text-muted-foreground text-[11px]">
        {{ formatReplacedUnit(line.replaced_info) }}
      </p>
    </div>
  </div>
  <p v-else class="text-muted-foreground py-6 text-center text-xs">Sin unidades registradas</p>
</template>
