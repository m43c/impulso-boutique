<script setup>
import { computed } from 'vue'
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
import ProductUnitsForm from '@/components/products/units/ProductUnitsForm.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'submit'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const openModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const productName = computed(() => props.product?.name ?? '')

function handleSubmit(payload) {
  emit('submit', payload)
  openModel.value = false
}
</script>

<template>
  <!-- Desktop -->
  <Dialog v-if="isDesktop" v-model:open="openModel">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-md">
      <DialogHeader class="border-border/60 px-6 pt-6">
        <DialogTitle>Agregar unidades</DialogTitle>
        <DialogDescription v-if="productName" class="pb-4">
          {{ productName }}
        </DialogDescription>
      </DialogHeader>
      <ProductUnitsForm :product="product" @submit="handleSubmit" @cancel="openModel = false" />
    </DialogContent>
  </Dialog>
  <!-- Mobile -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent class="max-h-[85vh]">
      <DrawerHeader class="border-border/60 px-6 pb-4 text-left">
        <DrawerTitle>Agregar unidades</DrawerTitle>
        <DrawerDescription v-if="productName">
          {{ productName }}
        </DrawerDescription>
      </DrawerHeader>
      <ProductUnitsForm :product="product" @submit="handleSubmit" @cancel="openModel = false" />
    </DrawerContent>
  </Drawer>
</template>
