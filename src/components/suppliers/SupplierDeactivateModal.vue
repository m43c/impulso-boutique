<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Loader2, TriangleAlert } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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

const props = defineProps({
  open: { type: Boolean, default: false },
  supplier: { type: Object, default: null },
  productCount: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'confirm'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const openModel = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const productLabel = computed(() =>
  props.productCount === 1 ? '1 producto asociado' : `${props.productCount} productos asociados`,
)

function handleCancel() {
  if (props.isLoading) {
    return
  }

  openModel.value = false
}

function handleConfirm() {
  if (props.isLoading) {
    return
  }

  emit('confirm')
}
</script>

<template>
  <!-- Desktop view -->
  <Dialog v-if="isDesktop" v-model:open="openModel">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-sm">
      <DialogHeader class="border-border/60 gap-1 px-6 pt-6">
        <DialogTitle class="text-sm">Desactivar proveedor</DialogTitle>
        <DialogDescription v-if="supplier" class="pb-2.5 text-xs">
          {{ supplier.name }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col px-6 pt-2">
        <!-- Desktop view -->
        <Alert variant="destructive" class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <TriangleAlert class="h-4 w-4" />
            <AlertTitle class="mb-0 text-xs">Productos asociados</AlertTitle>
          </div>
          <AlertDescription class="text-xs">
            Este proveedor tiene {{ productLabel }}. Si lo desactivas, esos productos seguirán
            vinculados a él, pero no podrás asignarlo a nuevos productos ni variantes mientras esté
            inactivo.
          </AlertDescription>
        </Alert>
      </div>
      <div
        class="border-border/60 flex flex-col-reverse gap-2 px-6 py-6 sm:flex-row sm:justify-end"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="handleCancel"
        >
          <span class="text-xs">Cancelar</span>
        </Button>
        <Button type="button" variant="destructive" size="sm" :disabled="isLoading" @click="handleConfirm">
          <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
          <span class="text-xs">{{ isLoading ? 'Desactivando…' : 'Desactivar proveedor' }}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="openModel">
    <DrawerContent class="max-h-[85vh]">
      <DrawerHeader class="border-border/60 gap-0.5 px-6 pb-4 text-left">
        <DrawerTitle class="">Desactivar proveedor</DrawerTitle>
        <DrawerDescription v-if="supplier" class="">{{ supplier.name }}</DrawerDescription>
      </DrawerHeader>
      <div class="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
        <Alert variant="destructive" class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <TriangleAlert class="h-4 w-4" />
            <AlertTitle class="mb-0 text-xs">Productos asociados</AlertTitle>
          </div>
          <AlertDescription class="text-xs">
            Este proveedor tiene {{ productLabel }}. Si lo desactivas, esos productos seguirán
            vinculados a él, pero no podrás asignarlo a nuevos productos ni variantes mientras esté
            inactivo.
          </AlertDescription>
        </Alert>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" :disabled="isLoading" @click="handleCancel">
            Cancelar
          </Button>
          <Button type="button" :disabled="isLoading" @click="handleConfirm">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            {{ isLoading ? 'Desactivando…' : 'Desactivar proveedor' }}
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
