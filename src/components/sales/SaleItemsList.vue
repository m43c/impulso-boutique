<script setup>
import { useMediaQuery } from '@vueuse/core'
import { X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ProductImage from '@/components/products/ProductImage.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { shortId } from '@/utils/sales'

defineProps({
  items: { type: Array, default: () => [] },
  failedUnitId: { type: String, default: null },
})

const emit = defineEmits(['remove'])

const isDesktop = useMediaQuery('(min-width: 768px)')

function variantLabel(item) {
  return [item.color, item.size].filter(Boolean).join(' · ')
}
</script>

<template>
  <!-- Desktop view -->
  <Table v-if="isDesktop">
    <TableHeader>
      <TableRow>
        <TableHead class="lg:text-xs">Prenda</TableHead>
        <TableHead class="w-28 lg:text-xs">Código</TableHead>
        <TableHead class="w-32 text-right lg:text-xs">Precio</TableHead>
        <TableHead class="w-12 lg:text-xs" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="item in items"
        :key="item.id"
        :class="failedUnitId === item.id ? 'bg-destructive/10 hover:bg-destructive/10' : ''"
      >
        <TableCell>
          <div class="flex items-center gap-3">
            <ProductImage
              :public-id="item.imagePublicId"
              :alt="item.productName"
              :size="IMAGE_SIZES.thumb"
            />
            <div class="min-w-0">
              <p class="truncate text-xs font-medium">{{ item.productName }}</p>
              <p v-if="variantLabel(item)" class="text-muted-foreground truncate text-xs">
                {{ variantLabel(item) }}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell
          class="font-mono text-xs"
          :class="failedUnitId === item.id ? 'text-destructive font-semibold' : ''"
        >
          {{ shortId(item.id) }}
        </TableCell>
        <TableCell class="text-right text-xs">{{ formatCurrency(item.price) }}</TableCell>
        <TableCell class="text-right">
          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-full"
            aria-label="Quitar prenda"
            @click="emit('remove', item.id)"
          >
            <X class="size-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
  <!-- Mobile view -->
  <div v-else class="flex flex-col gap-2 p-2">
    <div
      v-for="item in items"
      :key="item.id"
      class="flex items-start gap-3 rounded-lg border p-3"
      :class="failedUnitId === item.id ? 'border-destructive/50 bg-destructive/5' : ''"
    >
      <ProductImage
        :public-id="item.imagePublicId"
        :alt="item.productName"
        :size="IMAGE_SIZES.thumb"
        image-class="h-14 w-14 shrink-0 rounded-md object-cover"
        fallback-class="bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-md"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ item.productName }}</p>
        <p v-if="variantLabel(item)" class="text-muted-foreground truncate text-xs">
          {{ variantLabel(item) }}
        </p>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span
            class="text-muted-foreground font-mono text-[11px]"
            :class="failedUnitId === item.id ? 'text-destructive font-semibold' : ''"
          >
            {{ shortId(item.id) }}
          </span>
          <span class="text-sm font-medium">{{ formatCurrency(item.price) }}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="size-8 shrink-0 -mt-1 -mr-2"
        aria-label="Quitar prenda"
        @click="emit('remove', item.id)"
      >
        <X class="size-4" />
      </Button>
    </div>
  </div>
</template>
