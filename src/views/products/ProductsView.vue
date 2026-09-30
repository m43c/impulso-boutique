<script setup>
import { onMounted, ref } from 'vue'
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
} from '@/components/ui/sheet'
import ProductForm from '@/components/products/ProductForm.vue'
import ProductsList from '@/components/products/ProductsList.vue'
import ProductDetails from '@/components/products/ProductDetails.vue'

const productsStore = useProductsStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

const isSheetOpen = ref(false)
const isDetailsOpen = ref(false)
const fetchError = ref(null)
const detailsProduct = ref(null)

async function loadProducts() {
  fetchError.value = null

  try {
    await productsStore.fetchProducts()
  } catch (error) {
    console.error('Error al cargar productos:', error)
    fetchError.value = 'No se pudieron cargar los productos'
  }
}

onMounted(() => loadProducts())

function getFakeImageUrl(seed) {
  const safeSeed = encodeURIComponent(seed || Date.now().toString())
  return `https://picsum.photos/seed/${safeSeed}/600/600`
}

async function handleSubmit(formData) {
  try {
    const payload = {
      name: formData.name,
      description: formData.description,
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

    productsStore.fetchProducts()
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

function handleViewDetails(product) {
  detailsProduct.value = product
  isDetailsOpen.value = true
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <Sheet v-model:open="isSheetOpen">
      <!-- Products list -->
      <ProductsList
        :products="productsStore.products"
        :is-loading="productsStore.isFetching"
        :error="fetchError"
        @add-product="handleAddProduct"
        @retry="loadProducts"
        @view-details="handleViewDetails"
      />
      <!-- Product details -->
      <ProductDetails v-model:open="isDetailsOpen" :product="detailsProduct" />
      <!-- Mobile add product button -->
      <Button
        v-if="!fetchError"
        size="icon"
        class="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full md:hidden"
        aria-label="Agregar producto"
        @click="handleAddProduct"
      >
        <PackagePlus class="size-5" />
      </Button>
      <!-- Product form -->
      <SheetContent
        :side="isDesktop ? 'right' : 'bottom'"
        class="w-full p-6 sm:max-w-md"
        :class="!isDesktop ? 'h-[90dvh] rounded-t-2xl' : ''"
      >
        <SheetHeader class="p-0 pb-2">
          <SheetTitle>Crear producto</SheetTitle>
          <SheetDescription>Completa la información del nuevo producto</SheetDescription>
        </SheetHeader>
        <ProductForm
          :is-loading="productsStore.isCreating"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>
