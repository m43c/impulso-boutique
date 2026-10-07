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
import { getProductErrorMessage } from '@/utils/productErrors'

const productsStore = useProductsStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

const isSheetOpen = ref(false)
const isDetailsOpen = ref(false)
const fetchError = ref(null)
const formError = ref(null)
const detailsProduct = ref(null)
const editingProduct = ref(null)

async function loadProducts() {
  fetchError.value = null

  try {
    await productsStore.fetchProducts()
  } catch (error) {
    console.error('Error al cargar productos:', error)
    fetchError.value = 'No se pudieron cargar los productos'
  }
}

function loadOptions() {
  productsStore.fetchOptions().catch((error) => {
    console.error('Error al cargar las sugerencias:', error)
  })
}

onMounted(() => loadProducts())

async function handleSubmit(formData) {
  const isEditing = !!editingProduct.value
  formError.value = null

  try {
    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      brand: formData.brand,
      color: formData.color,
      size: formData.size,
      price: formData.price,
      min_stock: formData.minStock,
    }

    if (isEditing) {
      await productsStore.updateProduct({ ...payload, id: editingProduct.value.id }, formData.image)
      toast.success('Producto actualizado correctamente')
    } else {
      await productsStore.createProduct(payload, formData.image)
      toast.success('Producto creado correctamente')
    }

    loadProducts()

    isSheetOpen.value = false
    editingProduct.value = null
  } catch (error) {
    console.error('Error al guardar el producto:', error)

    formError.value = getProductErrorMessage(
      error,
      isEditing ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto',
    )
  }
}

function handleCancel() {
  isSheetOpen.value = false
  editingProduct.value = null
  formError.value = null
}

function handleAddProduct() {
  editingProduct.value = null
  formError.value = null
  isSheetOpen.value = true
  loadOptions()
}

function handleEditProduct(product) {
  editingProduct.value = product
  formError.value = null
  isSheetOpen.value = true
  loadOptions()
}

function handleViewDetails(product) {
  detailsProduct.value = product
  isDetailsOpen.value = true
}

async function handleToggleStatus(product) {
  const isRetiring = product.is_active
  const actionText = isRetiring ? 'retirar' : 'reponer'

  try {
    await productsStore.toggleProductStatus(product.id, !isRetiring)
    toast.success(`Producto ${isRetiring ? 'retirado' : 'repuesto'} correctamente`)
    loadProducts()
  } catch (error) {
    console.error(`Error al ${actionText} producto:`, error)
    toast.error(getProductErrorMessage(error, `No se pudo ${actionText} el producto`))
  }
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
        @view-details="handleViewDetails"
        @edit-product="handleEditProduct"
        @toggle-status="handleToggleStatus"
        @retry="loadProducts"
        @refresh="loadProducts"
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
          <SheetTitle>{{ editingProduct ? 'Editar producto' : 'Crear producto' }}</SheetTitle>
          <SheetDescription>
            {{
              editingProduct
                ? 'Actualiza la información del producto'
                : 'Completa la información del nuevo producto'
            }}
          </SheetDescription>
        </SheetHeader>
        <ProductForm
          :product="editingProduct"
          :is-loading="productsStore.isCreating || productsStore.isUpdating"
          :error-message="formError"
          :options="productsStore.options"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>
