<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { toast } from 'vue-sonner'
import { Boxes, Calculator, CircleAlert, Loader2, Package } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ProductDetailsBody from '@/components/products/ProductDetailsBody.vue'
import ProductDetailsSkeleton from '@/components/products/ProductDetailsSkeleton.vue'
import ProductUnitsModal from '@/components/products/ProductUnitsModal.vue'
import ProductUnitsLabelsModal from '@/components/products/ProductUnitsLabelsModal.vue'

const route = useRoute()
const productsStore = useProductsStore()

const product = ref(null)
const isLoading = ref(true)
const error = ref(null)
const activeTab = ref('units')

const isUnitsModalOpen = ref(false)
const isLabelsModalOpen = ref(false)
const registeredUnitIds = ref([])

async function loadProduct() {
  isLoading.value = true
  error.value = null

  const id = route.params.id

  try {
    const cached = productsStore.products.find((p) => p.id === id)

    if (cached) {
      product.value = cached
    } else {
      product.value = await productsStore.fetchProductById(id)

      if (!product.value) {
        error.value = 'Producto no encontrado'
        return
      }
    }

    await productsStore.fetchUnitStats(id)
  } catch (e) {
    console.error('Error al cargar el producto:', e)
    error.value = 'No se pudo cargar el producto'
  } finally {
    isLoading.value = false
  }
}

async function handleUnitsSubmit({ unitIds, quantity }) {
  const noun = quantity === 1 ? 'unidad registrada' : 'unidades registradas'

  toast.success(`${quantity} ${noun} correctamente`)

  await productsStore.fetchUnitStats(product.value.id)

  registeredUnitIds.value = unitIds
  isLabelsModalOpen.value = true

  activeTab.value = 'units'
}

function handleLabelsClose(open) {
  isLabelsModalOpen.value = open
  if (!open) {
    registeredUnitIds.value = []
  }
}

function openUnitsModal() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  isUnitsModalOpen.value = true
}

onMounted(loadProduct)

onBeforeUnmount(() => {
  productsStore.resetUnitStats()
})

watch(() => route.params.id, loadProduct)
</script>

<template>
  <div class="w-full px-6 pb-6 lg:pb-0">
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-[320px_minmax(0,1fr)]"
    >
      <!-- Skeleton (Left column) -->
      <ProductDetailsSkeleton />
    </div>
    <!-- Error status -->
    <Card v-else-if="error" class="flex h-[calc(100vh-5rem)] flex-col">
      <CardContent class="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
          <CircleAlert />
        </div>
        <h3 class="text-base font-semibold">{{ error }}</h3>
        <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">Inténtalo nuevamente</p>
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadProduct">
          <Loader2 v-if="isLoading" class="animate-spin" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
    <!-- Columns -->
    <div
      v-else-if="product"
      class="grid grid-cols-1 gap-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-[320px_minmax(0,1fr)]"
    >
      <!-- Left column (Product details) -->
      <div class="lg:min-h-0">
        <Card class="w-full py-0 lg:flex lg:h-full lg:flex-col">
          <CardContent class="w-full min-w-0 p-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <ProductDetailsBody :product="product" :stats="productsStore.unitStats" />
            </div>
          </CardContent>
        </Card>
      </div>
      <!-- Right column (Units and history) -->
      <div class="flex min-h-0 flex-col gap-4 lg:min-h-0 lg:flex-col lg:gap-4">
        <!-- header -->
        <div class="flex shrink-0 flex-col items-center justify-between gap-4 mb-2">
          <!-- Tabs -->
          <div
            class="border-border/60 inline-flex w-full rounded-md border p-0.5 lg:w-auto lg:self-start"
          >
            <!-- Units tab -->
            <button
              type="button"
              class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition lg:flex-none"
              :class="
                activeTab === 'units'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="activeTab = 'units'"
            >
              Unidades
            </button>
            <!-- History tab -->
            <button
              type="button"
              class="flex-1 rounded px-3 py-1.5 text-sm font-medium transition lg:flex-none"
              :class="
                activeTab === 'history'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="activeTab = 'history'"
            >
              Historial
            </button>
          </div>
          <!-- Action buttons -->
          <div class="hidden w-full justify-end gap-2 lg:flex">
            <Button variant="outline">
              <Calculator class="h-4 w-4" />
              Conteo físico
            </Button>
            <Button @click="openUnitsModal">
              <Boxes class="h-4 w-4" />
              Agregar unidades
            </Button>
          </div>
        </div>
        <!-- Panel content -->
        <Card class="flex min-h-[50vh] flex-col overflow-hidden py-0 lg:min-h-0 lg:flex-1">
          <CardContent class="flex min-h-0 flex-1 flex-col p-0 lg:overflow-y-auto">
            <!-- Units empty status -->
            <div
              v-if="activeTab === 'units'"
              class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
            >
              <div class="bg-muted text-muted-foreground mb-4 rounded-full p-3">
                <Package class="h-9 w-9" />
              </div>
              <h3 class="text-sm font-semibold">Aún no hay unidades</h3>
              <p class="text-muted-foreground mt-1 max-w-xs text-xs">
                Registra la primera compra para generar QR
              </p>
              <!-- Actions -->
              <div class="mt-4 flex max-w-xs flex-col gap-2 lg:hidden">
                <Button variant="outline" class="w-full">
                  <Calculator class="h-4 w-4" />
                  Conteo físico
                </Button>
              </div>
            </div>
            <!-- History empty status -->
            <div
              v-else
              class="text-muted-foreground flex flex-1 items-center justify-center text-sm"
            >
              Aún no hay movimientos registrados
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <!-- Units modal/drawer -->
    <ProductUnitsModal
      v-model:open="isUnitsModalOpen"
      :product="product"
      @submit="handleUnitsSubmit"
    />
    <!-- Units codes QR -->
    <ProductUnitsLabelsModal
      :open="isLabelsModalOpen"
      :product="product"
      :unit-ids="registeredUnitIds"
      @update:open="handleLabelsClose"
    />
    <!-- Floating add units button -->
    <Button
      v-if="activeTab === 'units' && product"
      size="icon"
      class="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg lg:hidden"
      aria-label="Agregar unidades"
      @click="openUnitsModal"
    >
      <Boxes class="size-5" />
    </Button>
  </div>
</template>
