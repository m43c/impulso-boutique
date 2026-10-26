<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { getProductErrorMessage } from '@/utils/productErrors'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const productsStore = useProductsStore()

const isDesktop = useMediaQuery('(min-width: 768px)')
const { can } = usePermissions()

const isSheetOpen = ref(false)
const fetchError = ref(null)
const formError = ref(null)
const formMode = ref('create')
const formProduct = ref(null)

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
  const mode = formMode.value
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

    if (mode === 'edit') {
      await productsStore.updateProduct({ ...payload, id: formProduct.value.id }, formData.image)
      toast.success('Producto actualizado correctamente')
    } else if (mode === 'variant') {
      const imagePublicId = formData.image ? null : (formProduct.value?.image_public_id ?? null)
      const newId = await productsStore.createProductVariant(
        formProduct.value.id,
        payload,
        formData.image,
        imagePublicId,
      )
      
      toast.success('Variante creada', {
        action: { label: 'Ver producto', onClick: () => router.push('/products/' + newId) },
      })
    } else {
      await productsStore.createProduct(payload, formData.image)
      toast.success('Producto creado correctamente')
    }

    loadProducts()

    isSheetOpen.value = false
    formMode.value = 'create'
    formProduct.value = null
  } catch (error) {
    console.error('Error al guardar el producto:', error)

    formError.value = getProductErrorMessage(
      error,
      mode === 'edit'
        ? 'No se pudo actualizar el producto'
        : mode === 'variant'
          ? 'No se pudo crear la variante'
          : 'No se pudo crear el producto',
    )
  }
}

function handleCancel() {
  isSheetOpen.value = false
  formMode.value = 'create'
  formProduct.value = null
  formError.value = null
}

function handleAddProduct() {
  formMode.value = 'create'
  formProduct.value = null
  formError.value = null
  isSheetOpen.value = true

  loadOptions()
}

function handleEditProduct(product) {
  formMode.value = 'edit'
  formProduct.value = product
  formError.value = null
  isSheetOpen.value = true

  loadOptions()
}

function handleCreateProductVariant(product) {
  formMode.value = 'variant'
  formProduct.value = product
  formError.value = null
  isSheetOpen.value = true

  loadOptions()
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
        @edit-product="handleEditProduct"
        @create-variant="handleCreateProductVariant"
        @toggle-status="handleToggleStatus"
        @retry="loadProducts"
        @refresh="loadProducts"
      />
      <!-- Floating add product button -->
      <Button
        v-if="!fetchError && can('products:create')"
        size="icon"
        class="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full md:hidden"
        aria-label="Agregar producto"
        :disabled="productsStore.isFetching"
        @click="handleAddProduct"
      >
        <PackagePlus class="size-5" />
      </Button>
      <!-- Product form -->
      <SheetContent
        v-if="can('products:create') || can('products:update')"
        :side="isDesktop ? 'right' : 'bottom'"
        class="w-full p-6 sm:max-w-md"
        :class="!isDesktop ? 'h-[90dvh] rounded-t-2xl' : ''"
      >
        <SheetHeader class="gap-0.5 p-0 pb-0">
          <SheetTitle>
            {{
              formMode === 'edit'
                ? 'Editar producto'
                : formMode === 'variant'
                  ? 'Crear variante'
                  : 'Crear producto'
            }}
          </SheetTitle>
          <SheetDescription>
            {{
              formMode === 'edit'
                ? 'Actualiza la información del producto'
                : formMode === 'variant'
                  ? 'Crea una nueva variante modificando los atributos que necesites'
                  : 'Completa la información del nuevo producto'
            }}
          </SheetDescription>
        </SheetHeader>
        <ProductForm
          :product="formProduct"
          :mode="formMode"
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
