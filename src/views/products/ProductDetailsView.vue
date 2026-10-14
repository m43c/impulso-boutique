<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { CircleAlert, Loader2 } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ProductDetailsBody from '@/components/products/ProductDetailsBody.vue'
import ProductDetailsSkeleton from '@/components/products/ProductDetailsSkeleton.vue'

const route = useRoute()

const productsStore = useProductsStore()

const product = ref(null)
const isLoading = ref(true)
const error = ref(null)

async function loadProduct() {
  isLoading.value = true
  error.value = null

  const id = route.params.id

  try {
    const cached = productsStore.products.find((p) => p.id === id)

    if (cached) {
      product.value = cached
      return
    }

    product.value = await productsStore.fetchProductById(id)

    if (!product.value) {
      error.value = 'Producto no encontrado'
    }
  } catch (e) {
    console.error('Error al cargar el producto:', e)
    error.value = 'No se pudo cargar el producto'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProduct)

watch(() => route.params.id, loadProduct)
</script>

<template>
  <div class="flex w-full max-w-3xl flex-col gap-4 px-6">
    <!-- Skeleton -->
    <ProductDetailsSkeleton v-if="isLoading" />
    <!-- Error -->
    <Card v-else-if="error">
      <CardContent class="flex flex-col items-center justify-center p-8 text-center">
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
    <!-- Content -->
    <Card v-else-if="product" class="w-full py-0">
      <CardContent class="w-full min-w-0 p-4 md:p-4">
        <ProductDetailsBody :product="product" />
      </CardContent>
    </Card>
  </div>
</template>
