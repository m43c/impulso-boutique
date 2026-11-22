<script setup>
import { useMediaQuery } from '@vueuse/core'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import SaleDetailLines from '@/components/sales/SaleDetailLines.vue'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatItemsCount, formatPaymentMethod, formatSaleTotal, shortId } from '@/utils/sales'

defineProps({
  sale: { type: Object, default: null },
})

const open = defineModel('open', { type: Boolean, default: false })

const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <!-- Desktop view (sheet) -->
  <Sheet v-if="isDesktop" v-model:open="open">
    <SheetContent class="flex w-full flex-col gap-0 px-5 py-4 sm:max-w-md">
      <SheetHeader class="gap-0.5 p-0 pb-3">
        <SheetTitle class="lg:text-[13px]">
          <span>Venta #{{ shortId(sale?.id) }}</span>
        </SheetTitle>
        <SheetDescription v-if="sale" class="lg:text-xs">
          {{ formatDateTimeLaPaz(sale.created_at) }} ·
          {{ formatPaymentMethod(sale.payment_method) }}
        </SheetDescription>
      </SheetHeader>
      <template v-if="sale">
        <div class="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <span class="shrink-0">Responsable:</span>
          <span class="text-foreground truncate">{{ sale.profile_name }}</span>
        </div>
        <div class="flex gap-2 text-xs">
          <span class="text-muted-foreground shrink-0">Prendas vendidas:</span>
          <p class="text-xs">{{ formatItemsCount(sale.items_count) }}</p>
        </div>
        <div class="mt-4 min-h-0 flex-1 overflow-y-auto">
          <SaleDetailLines :lines="sale.lines" />
        </div>
        <div class="mt-4 flex items-center justify-between border-t pt-3">
          <span class="text-sm">Total</span>
          <span class="text-base font-semibold tabular-nums">
            {{ formatSaleTotal(sale.total_amount) }}
          </span>
        </div>
      </template>
    </SheetContent>
  </Sheet>
  <!-- Mobile view (drawer) -->
  <Drawer v-else v-model:open="open">
    <DrawerContent class="flex max-h-[90dvh] flex-col pb-4">
      <DrawerHeader class="gap-0 px-5 pt-3 pb-2 text-left">
        <DrawerTitle class="text-sm">Venta #{{ shortId(sale?.id) }}</DrawerTitle>
        <DrawerDescription v-if="sale" class="text-xs">
          {{ formatDateTimeLaPaz(sale.created_at) }} ·
          {{ formatPaymentMethod(sale.payment_method) }}
        </DrawerDescription>
      </DrawerHeader>
      <div v-if="sale" class="flex min-h-0 flex-1 flex-col px-5">
        <div class="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <span class="shrink-0">Responsable:</span>
          <span class="text-foreground truncate">{{ sale.profile_name }}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-muted-foreground shrink-0 text-xs">Prendas vendidas:</span>
          <p class="text-xs">{{ formatItemsCount(sale.items_count) }}</p>
        </div>
        <div class="mt-4 min-h-0 flex-1 overflow-y-auto">
          <SaleDetailLines :lines="sale.lines" />
        </div>
        <div class="mt-4 flex items-center justify-between border-t pt-3">
          <span class="text-sm">Total</span>
          <span class="text-base font-semibold tabular-nums">
            {{ formatSaleTotal(sale.total_amount) }}
          </span>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
