<script setup>
import { ref } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useMediaQuery } from '@vueuse/core'
import { PackagePlus } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import ProductForm from '@/components/products/ProductForm.vue'

const productsStore = useProductsStore()
const isDesktop = useMediaQuery('(min-width: 768px)')

const isSheetOpen = ref(false)

function getFakeImageUrl(seed) {
  const safeSeed = encodeURIComponent(seed || Date.now().toString())
  return `https://picsum.photos/seed/${safeSeed}/600/600`
}

async function handleSubmit(formData) {
  try {
    const payload = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      color: formData.color,
      size: formData.size,
      price: formData.price,
      image_url: getFakeImageUrl(formData.name),
      min_stock: formData.minStock,
    }

    await productsStore.createProduct(payload)
    toast.success('Producto creado correctamente')
    console.log({ ...formData })

    isSheetOpen.value = false
  } catch (error) {
    console.error('Error al guardar el producto:', error)
    toast.error('No se pudo crear el producto')
  }
}

function handleCancel() {
  isSheetOpen.value = false
}

function handleAddProduct() {
  isSheetOpen.value = true
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <Sheet v-model:open="isSheetOpen">
      <div class="flex flex-1 justify-end">
        <SheetTrigger as-child class="hidden md:inline-flex">
          <Button @click="handleAddProduct">
            <PackagePlus class="size-4" />
            Agregar producto
          </Button>
        </SheetTrigger>
      </div>
      <!-- Add user button -->
      <SheetTrigger as-child class="md:hidden">
        <Button
          size="icon"
          class="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full"
          aria-label="Agregar producto"
          @click="handleAddProduct"
        >
          <PackagePlus class="size-5" />
        </Button>
      </SheetTrigger>
      <!-- Product form -->
      <SheetContent
        :side="isDesktop ? 'right' : 'bottom'"
        class="w-full p-6 sm:max-w-md"
        :class="!isDesktop ? 'h-[90dvh] rounded-t-2xl' : ''"
      >
        <!-- Title and description -->
        <SheetHeader class="p-0 pb-2">
          <SheetTitle>Crear producto</SheetTitle>
          <SheetDescription>Completa la información del nuevo producto</SheetDescription>
        </SheetHeader>
        <!-- Form -->
        <ProductForm
          :is-loading="productsStore.isCreating"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>
