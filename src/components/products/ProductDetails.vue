<script setup>
import { useMediaQuery } from '@vueuse/core'
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
import ProductDetailsBody from '@/components/products/ProductDetailsBody.vue'

defineProps({
  product: {
    type: Object,
    default: null,
  },
})

const open = defineModel('open', {
  type: Boolean,
  default: false,
})

const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Detalle del producto</DialogTitle>
        <DialogDescription>Información completa del producto</DialogDescription>
      </DialogHeader>
      <ProductDetailsBody v-if="product" :product="product" />
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="open">
    <DrawerContent class="px-6 py-0">
      <DrawerHeader class="p-0 py-4 text-left">
        <DrawerTitle>Detalle del producto</DrawerTitle>
        <DrawerDescription>Información completa del producto</DrawerDescription>
      </DrawerHeader>
      <div class="max-h-[70dvh] overflow-y-auto pb-4">
        <ProductDetailsBody v-if="product" :product="product" />
      </div>
    </DrawerContent>
  </Drawer>
</template>
