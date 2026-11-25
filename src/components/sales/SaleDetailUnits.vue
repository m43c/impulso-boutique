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
  units: { type: Array, default: () => [] },
  canCreateReturn: { type: Boolean, default: false },
})

const emit = defineEmits(['return-unit'])

function variantLabel(unit) {
  return [unit.color, unit.size].filter(Boolean).join(' · ')
}
</script>

<template>
  <div v-if="units.length" class="flex flex-col gap-3">
    <div v-for="unit in units" :key="unit.unit_id" class="flex flex-col gap-1">
      <div class="flex items-start gap-3">
        <ProductImage
          :public-id="unit.image_public_id"
          :alt="unit.product_name"
          :size="IMAGE_SIZES.thumb"
          image-class="h-12 w-12 shrink-0 rounded-md object-cover"
          fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
        />
        <div class="-mt-0.5 min-w-0 flex-1">
          <p class="truncate text-xs font-medium">{{ unit.product_name }}</p>
          <p v-if="variantLabel(unit)" class="text-muted-foreground mt-1.5 truncate text-xs">
            {{ variantLabel(unit) }}
          </p>
          <p class="text-muted-foreground font-mono text-[11px]">{{ shortId(unit.unit_id) }}</p>
        </div>
        <div class="-mt-0.5 flex shrink-0 flex-col items-end gap-1">
          <span class="text-sm font-medium tabular-nums">
            {{ formatCurrency(unit.unit_price) }}
          </span>
          <Button
            v-if="canCreateReturn && unit.can_return"
            size="sm"
            class="h-6 rounded-sm px-2 text-xs lg:pt-0.5 lg:text-[11px]"
            @click="emit('return-unit', unit)"
          >
            {{ unit.is_replacement_unit ? 'Cambiar otra vez' : 'Devolver' }}
          </Button>
        </div>
      </div>
      <!-- Return info -->
      <div v-if="unit.return_info" class="flex flex-col">
        <!-- Status + type move -->
        <span class="text-[11px] font-medium text-amber-400 dark:text-amber-400">
          Devuelta · {{ formatReturnType(unit.return_info.type) }}
        </span>
        <!-- Reason -->
        <div class="flex gap-1.5">
          <span class="text-muted-foreground text-[11px]">Motivo:</span>
          <span class="text-[11px]">{{ formatReturnReason(unit.return_info.reason) }}</span>
        </div>
        <div v-if="formatReturnReplacement(unit.return_info)" class="flex gap-1.5">
          <span class="text-muted-foreground text-[11px]">Por:</span>
          <span class="text-[11px]">
            {{ formatReturnReplacement(unit.return_info) }}
          </span>
        </div>
      </div>
      <p v-if="formatReplacedUnit(unit.replaced_info)" class="-mt-1 text-[11px]">
        <span class="text-muted-foreground text-[11px] mr-1">Cambio de:</span>
        {{ formatReplacedUnit(unit.replaced_info) }}
      </p>
    </div>
  </div>
  <p v-else class="text-muted-foreground py-6 text-center text-xs">Sin unidades registradas</p>
</template>
