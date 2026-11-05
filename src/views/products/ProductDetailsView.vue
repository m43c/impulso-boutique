<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { toast } from 'vue-sonner'
import { Boxes, ClipboardCheck, CircleAlert, Loader2 } from '@lucide/vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ProductDetailsBody from '@/components/products/details/ProductDetailsBody.vue'
import ProductDetailsSkeleton from '@/components/products/details/ProductDetailsSkeleton.vue'
import ProductUnitsModal from '@/components/products/units/modals/ProductUnitsModal.vue'
import ProductUnitsLabelsModal from '@/components/products/units/modals/ProductUnitsLabelsModal.vue'
import ProductUnitsList from '@/components/products/units/ProductUnitsList.vue'
import ProductUnitsSkeleton from '@/components/products/units/skeletons/ProductUnitsSkeleton.vue'
import ProductUnitQrModal from '@/components/products/units/modals/ProductUnitQrModal.vue'
import ProductHistoryList from '@/components/products/history/ProductHistoryList.vue'
import { usePermissions } from '@/composables/usePermissions'
import ProductUnitExitModal from '@/components/products/units/modals/ProductUnitExitModal.vue'
import ProductUnitReactivateModal from '@/components/products/units/modals/ProductUnitReactivateModal.vue'
import ProductUnitsCountModal from '@/components/products/units/modals/ProductUnitsCountModal.vue'

const route = useRoute()
const productsStore = useProductsStore()
const { can } = usePermissions()

const product = ref(null)
const isLoading = ref(true)
const error = ref(null)

const availableTabs = computed(() => {
  const tabs = []
  if (can('inventory:view-units')) tabs.push('units')
  if (can('inventory:view-history')) tabs.push('history')
  return tabs
})

const showTabs = computed(() => availableTabs.value.length > 1)

const activeTab = ref(availableTabs.value[0] ?? 'units')

watch(availableTabs, (tabs) => {
  if (!tabs.includes(activeTab.value) && tabs.length > 0) {
    activeTab.value = tabs[0]
  }
})

const isUnitsModalOpen = ref(false)
const isLabelsModalOpen = ref(false)
const registeredUnitIds = ref([])

const isQrModalOpen = ref(false)
const selectedUnitForQr = ref(null)

const isExitModalOpen = ref(false)
const isReactivateModalOpen = ref(false)
const selectedUnitForAction = ref(null)

const isCountModalOpen = ref(false)

const availableUnitsForCount = computed(() =>
  productsStore.productUnits.filter((u) => u.status === 'available'),
)

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

    await Promise.all([
      productsStore.fetchUnitStats(id),
      productsStore.fetchProductUnits(id),
      productsStore.fetchProductHistory(id),
    ])
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

  await Promise.all([
    productsStore.fetchUnitStats(product.value.id),
    productsStore.fetchProductUnits(product.value.id),
  ])

  registeredUnitIds.value = unitIds
  isLabelsModalOpen.value = true

  activeTab.value = 'units'
}

function handleLabelsClose(open) {
  isLabelsModalOpen.value = open
}

function openUnitsModal() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  isUnitsModalOpen.value = true
}

async function handleUnitsRefresh() {
  if (!product.value) return
  await productsStore.fetchProductUnits(product.value.id)
}

function handleUnitViewQr(unit) {
  selectedUnitForQr.value = unit
  isQrModalOpen.value = true
}

function handleQrReprint(unit) {
  registeredUnitIds.value = [unit.id]
  isLabelsModalOpen.value = true
}

function handleRegisterExit(unit) {
  selectedUnitForAction.value = unit
  isExitModalOpen.value = true
}

function handleReactivate(unit) {
  selectedUnitForAction.value = unit
  isReactivateModalOpen.value = true
}

async function handleExitSuccess({ reason }) {
  const label = reason === 'damage' ? 'daño' : 'pérdida'
  toast.success(`Unidad dada de baja por ${label}`)

  await Promise.all([
    productsStore.fetchUnitStats(product.value.id),
    productsStore.fetchProductUnits(product.value.id),
    productsStore.fetchProductHistory(product.value.id),
  ])
}

async function handleReactivateSuccess() {
  toast.success('Unidad reactivada (mismo QR)')

  await Promise.all([
    productsStore.fetchUnitStats(product.value.id),
    productsStore.fetchProductUnits(product.value.id),
    productsStore.fetchProductHistory(product.value.id),
  ])
}

function handleCountUnits() {
  isCountModalOpen.value = true
}

async function handleCountSuccess({ missing }) {
  const noun = missing === 1 ? 'unidad marcada' : 'unidades marcadas'
  const suffix = missing === 1 ? '' : 's'

  toast.success(`Conteo registrado: ${missing} ${noun} como faltante${suffix}`)

  await Promise.all([
    productsStore.fetchUnitStats(product.value.id),
    productsStore.fetchProductUnits(product.value.id),
    productsStore.fetchProductHistory(product.value.id),
  ])
}

watch(() => route.params.id, loadProduct)

const isScrollingDown = ref(false)
let lastScrollY = 0

function handleScroll() {
  const currentScrollY = window.scrollY

  if (currentScrollY <= 0) {
    isScrollingDown.value = false
    lastScrollY = currentScrollY
    return
  }

  const diff = currentScrollY - lastScrollY

  if (diff > 10) {
    isScrollingDown.value = true
  } else if (diff < -10) {
    isScrollingDown.value = false
  }

  if (Math.abs(diff) > 2) {
    lastScrollY = currentScrollY
  }
}

onMounted(() => {
  loadProduct()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  productsStore.resetUnitStats()
  productsStore.resetProductUnits()
  productsStore.resetProductHistory()

  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="w-full px-6 pb-6 lg:pb-0">
    <!-- Skeletons -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-[400px_minmax(0,1fr)]"
    >
      <!-- Skeleton (Left column) -->
      <div class="flex w-full flex-col lg:max-h-[calc(100vh-5rem)] lg:self-start">
        <ProductDetailsSkeleton />
      </div>
      <!-- Skeleton (Right column) -->
      <ProductUnitsSkeleton />
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
      class="grid grid-cols-1 gap-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-[400px_minmax(0,1fr)]"
    >
      <!-- Left column (Product details) -->
      <div class="flex w-full flex-col lg:max-h-[calc(100vh-5rem)] lg:self-start">
        <div
          class="bg-card flex w-full flex-col overflow-hidden rounded-xl border p-4 shadow-sm lg:max-h-full lg:rounded-md lg:px-5 lg:py-4 lg:shadow-none"
        >
          <div class="w-full min-w-0 flex-1 overflow-y-auto">
            <ProductDetailsBody :product="product" :stats="productsStore.unitStats" />
          </div>
        </div>
      </div>
      <!-- Right column (Units and history) -->
      <div class="flex min-h-0 flex-col gap-4 lg:min-h-0 lg:flex-col">
        <!-- headers -->
        <Tabs
          v-model="activeTab"
          class="flex min-h-0 flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-col"
        >
          <TabsList
            v-if="showTabs"
            class="border-border/60 inline-flex h-auto w-full items-center justify-start gap-0 rounded-md border bg-transparent p-0.5 lg:w-auto lg:self-start"
          >
            <TabsTrigger
              v-if="can('inventory:view-units')"
              value="units"
              class="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground dark:data-[state=active]:bg-muted flex-1 rounded px-3 py-2 text-xs font-medium transition data-[state=active]:bg-zinc-100 data-[state=active]:shadow-none lg:flex-none lg:py-1.5"
            >
              Unidades
            </TabsTrigger>
            <TabsTrigger
              v-if="can('inventory:view-history')"
              value="history"
              class="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground dark:data-[state=active]:bg-muted flex-1 rounded px-3 py-2 text-xs font-medium transition data-[state=active]:bg-zinc-100 data-[state=active]:shadow-none lg:flex-none lg:py-1.5"
            >
              Historial
            </TabsTrigger>
          </TabsList>
          <div
            class="bg-card flex min-h-[50vh] flex-col overflow-hidden rounded-xl border shadow-sm lg:min-h-0 lg:flex-1 lg:rounded-md lg:shadow-none"
          >
            <TabsContent
              value="units"
              class="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0 focus-visible:outline-none"
            >
              <ProductUnitsList
                v-if="can('inventory:view-units')"
                :units="productsStore.productUnits"
                :is-loading="productsStore.isFetchingUnits"
                :highlight-ids="registeredUnitIds"
                @add-units="openUnitsModal"
                @view-qr="handleUnitViewQr"
                @refresh="handleUnitsRefresh"
                @register-exit="handleRegisterExit"
                @reactivate-unit="handleReactivate"
                @count-units="handleCountUnits"
              />
            </TabsContent>
            <TabsContent
              value="history"
              class="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0 focus-visible:outline-none"
            >
              <ProductHistoryList
                v-if="can('inventory:view-history')"
                :history="productsStore.productHistory"
                :is-loading="productsStore.isFetchingHistory"
                @refresh="() => productsStore.fetchProductHistory(product.id)"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
    <!-- Register units -->
    <ProductUnitsModal
      v-model:open="isUnitsModalOpen"
      :product="product"
      @submit="handleUnitsSubmit"
    />
    <!-- Code QR view -->
    <ProductUnitsLabelsModal
      :open="isLabelsModalOpen"
      :product="product"
      :unit-ids="registeredUnitIds"
      @update:open="handleLabelsClose"
    />
    <!-- Show QR -->
    <ProductUnitQrModal
      v-model:open="isQrModalOpen"
      :unit="selectedUnitForQr"
      :product="product"
      @reprint="handleQrReprint"
    />
    <!-- Register exit -->
    <ProductUnitExitModal
      v-model:open="isExitModalOpen"
      :unit="selectedUnitForAction"
      :product="product"
      @success="handleExitSuccess"
    />
    <!-- Reactive unit -->
    <ProductUnitReactivateModal
      v-model:open="isReactivateModalOpen"
      :unit="selectedUnitForAction"
      :product="product"
      @success="handleReactivateSuccess"
    />
    <!-- Count modal -->
    <ProductUnitsCountModal
      v-model:open="isCountModalOpen"
      :product="product"
      :units="availableUnitsForCount"
      @success="handleCountSuccess"
    />
    <!-- FABs Container -->
    <div
      v-if="activeTab === 'units' && product"
      :class="[
        'fixed right-4 bottom-6 z-50 flex flex-col items-center gap-3 transition-all duration-300 lg:hidden',
        isScrollingDown
          ? 'pointer-events-none translate-y-8 opacity-0'
          : 'translate-y-0 opacity-100',
      ]"
    >
      <!-- Floating count units button -->
      <Button
        v-if="can('inventory:count')"
        size="icon"
        class="h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-900 shadow-md active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:active:bg-zinc-700"
        aria-label="Conteo físico"
        :disabled="productsStore.isFetchingUnits || availableUnitsForCount.length === 0"
        @click="handleCountUnits"
      >
        <ClipboardCheck class="size-4.5" />
      </Button>
      <!-- Floating add units button -->
      <Button
        v-if="can('inventory:register-entry')"
        size="icon"
        class="h-12 w-12 shrink-0 rounded-full shadow-lg"
        aria-label="Agregar unidades"
        :disabled="productsStore.isFetchingUnits"
        @click="openUnitsModal"
      >
        <Boxes class="size-5" />
      </Button>
    </div>
  </div>
</template>
