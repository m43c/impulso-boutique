<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDebounceFn, useMediaQuery } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useReturnsStore } from '@/stores/returns'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SalesList from '@/components/sales/SalesList.vue'
import SaleDetail from '@/components/sales/SaleDetail.vue'
import ReturnedUnitsList from '@/components/sales/returns/ReturnedUnitsList.vue'
import ReturnReviewModal from '@/components/sales/returns/ReturnReviewModal.vue'
import ProductUnitsLabelsModal from '@/components/products/units/modals/ProductUnitsLabelsModal.vue'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const router = useRouter()
const alertsStore = useAlertsStore()
const returnsStore = useReturnsStore()
const { can } = usePermissions()

const sales = ref([])
const isLoading = ref(false)
const error = ref(null)
const search = ref('')
const selectedSale = ref(null)
const isDetailOpen = ref(false)

const returnedUnits = ref([])
const returnedUnitsError = ref(null)
const hasLoadedReturnedUnits = ref(false)
const isLoadingReturnedUnits = ref(false)
const isReturnedListDirty = ref(false)

const isReviewModalOpen = ref(false)
const reviewTarget = ref(null)
const reviewApprove = ref(true)
const reviewError = ref(null)

const isLabelsModalOpen = ref(false)
const labelsProduct = ref(null)
const labelsUnitIds = ref([])

const availableTabs = computed(() => {
  const tabs = []

  if (can('sales:view-recent')) {
    tabs.push('sales')
  }

  if (can('returns:review')) {
    tabs.push('returns')
  }

  return tabs
})

const showTabs = computed(() => availableTabs.value.length > 1)
const activeTab = ref(resolveTab())
const isSalesTab = computed(() => activeTab.value === 'sales')
const isReturnsTab = computed(() => activeTab.value === 'returns')

const returnedTabLabel = computed(() => {
  const count = alertsStore.returnedCount

  return count > 0 ? `Devoluciones (${count})` : 'Devoluciones'
})

const isDesktop = useMediaQuery('(min-width: 768px)')

let requestId = 0
let searchVersion = 0
let returnedRequestId = 0
let pendingReturnedLoad = null
let returnedRefreshPending = false
let unregisterReturnedListener = null

function resolveTab() {
  return route.query.tab === 'returns' && can('returns:review') ? 'returns' : 'sales'
}

function replaceTabQuery(tab) {
  if (tab === resolveTab()) {
    return
  }

  const query = { ...route.query }

  if (tab === 'returns') {
    query.tab = 'returns'
  } else {
    delete query.tab
  }

  router.replace({ name: 'sales', query })
}

async function loadSales(searchTerm = '') {
  const id = ++requestId
  isLoading.value = true
  error.value = null

  try {
    const { data, error: rpcError } = await supabase.rpc('get_recent_sales', {
      p_search: searchTerm.trim() ? searchTerm.trim() : null,
    })

    if (id !== requestId) {
      return
    }

    if (rpcError) {
      throw rpcError
    }

    sales.value = data ?? []
  } catch (e) {
    if (id !== requestId) {
      return
    }

    console.error('Error al cargar ventas:', e)
    error.value = 'No se pudieron cargar las ventas'
    sales.value = []
  } finally {
    if (id === requestId) {
      isLoading.value = false
    }
  }
}

const SEARCH_DEBOUNCE_DESKTOP_MS = 300
const SEARCH_DEBOUNCE_MOBILE_MS = 400

const searchDebounceMs = computed(() =>
  isDesktop.value ? SEARCH_DEBOUNCE_DESKTOP_MS : SEARCH_DEBOUNCE_MOBILE_MS,
)

const debouncedLoadSales = useDebounceFn((value, version) => {
  if (version !== searchVersion) {
    return
  }

  loadSales(value)
}, searchDebounceMs)

function handleSearchInput(value) {
  search.value = value

  const term = value.trim()

  if (term.length === 1) {
    searchVersion++
    return
  }

  debouncedLoadSales(value, ++searchVersion)
}

function clearSearch() {
  searchVersion++
  search.value = ''
  loadSales('')
}

function refresh() {
  searchVersion++
  loadSales(search.value)
}

function handleOpenSale(sale) {
  selectedSale.value = sale
  isDetailOpen.value = true
}

function handleNewSale() {
  router.push({ name: 'sale-new' })
}

async function handleReturnRegistered(payload) {
  await loadSales(search.value)

  if (can('returns:review')) {
    alertsStore.fetchReturnedCount({ queueIfLoading: true })
  }

  const saleId = payload?.saleId

  if (!saleId) {
    return
  }

  const updated = sales.value.find((sale) => sale.id === saleId)

  if (updated) {
    selectedSale.value = updated
  } else {
    isDetailOpen.value = false
    selectedSale.value = null
  }
}

async function loadReturnedUnits() {
  if (!can('returns:review')) {
    return
  }

  if (pendingReturnedLoad) {
    returnedRefreshPending = true
    return
  }

  const id = ++returnedRequestId

  isLoadingReturnedUnits.value = true
  returnedUnitsError.value = null
  isReturnedListDirty.value = false

  pendingReturnedLoad = returnsStore.fetchReturnedUnits()

  try {
    const result = await pendingReturnedLoad

    if (id !== returnedRequestId) {
      return
    }

    if (!result.ok) {
      returnedUnitsError.value = result.message
      return
    }

    returnedUnits.value = result.units
    hasLoadedReturnedUnits.value = true
  } finally {
    if (id === returnedRequestId) {
      isLoadingReturnedUnits.value = false
    }

    pendingReturnedLoad = null

    if (returnedRefreshPending) {
      returnedRefreshPending = false
      loadReturnedUnits()
    }
  }
}

function handleReturnedUnitsChanged() {
  if (isReturnsTab.value) {
    loadReturnedUnits()
  } else {
    isReturnedListDirty.value = true
  }
}

function openReview(unit, approve) {
  if (returnsStore.isReviewing) {
    return
  }

  reviewTarget.value = unit
  reviewApprove.value = approve
  reviewError.value = null
  isReviewModalOpen.value = true
}

async function handleReviewConfirm(note) {
  const unit = reviewTarget.value

  if (!unit || returnsStore.isReviewing) {
    return
  }

  reviewError.value = null

  const result = await returnsStore.reviewReturnedUnit({
    unitId: unit.unit_id,
    approve: reviewApprove.value,
    note,
  })

  if (!result.ok) {
    if (result.code === 'S7008') {
      isReviewModalOpen.value = false
      toast.error(result.message)
      loadReturnedUnits()
      alertsStore.fetchReturnedCount({ queueIfLoading: true })
      return
    }

    reviewError.value = result.message
    return
  }

  isReviewModalOpen.value = false
  returnedUnits.value = returnedUnits.value.filter((item) => item.unit_id !== unit.unit_id)

  toast.success(reviewApprove.value ? 'Unidad aprobada: vuelve al stock' : 'Unidad descartada')

  await Promise.all([loadReturnedUnits(), alertsStore.fetchReturnedCount({ queueIfLoading: true })])
}

function handleReprint(unit) {
  labelsProduct.value = { name: unit.product_name }
  labelsUnitIds.value = [unit.unit_id]
  isLabelsModalOpen.value = true
}

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

watch(
  () => route.query.tab,
  () => {
    const nextTab = resolveTab()

    if (nextTab !== activeTab.value) {
      activeTab.value = nextTab
    }
  },
)

watch(
  activeTab,
  (tab) => {
    replaceTabQuery(tab)

    if (tab === 'returns') {
      isDetailOpen.value = false

      if (!hasLoadedReturnedUnits.value || isReturnedListDirty.value) {
        loadReturnedUnits()
      }
    } else {
      isReviewModalOpen.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadSales('')
  window.addEventListener('scroll', handleScroll, { passive: true })

  if (can('returns:review')) {
    unregisterReturnedListener = alertsStore.subscribeToReturnedUnits(handleReturnedUnitsChanged)
  }
})

onBeforeUnmount(() => {
  requestId++
  searchVersion++
  returnedRequestId++
  returnedRefreshPending = false
  unregisterReturnedListener?.()
  unregisterReturnedListener = null
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col gap-4">
      <TabsList
        v-if="showTabs"
        class="border-border/60 inline-flex h-auto w-full items-center justify-start gap-0 rounded-md border bg-transparent p-0.5 lg:w-auto lg:self-start"
      >
        <TabsTrigger
          value="sales"
          class="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground dark:data-[state=active]:bg-muted flex-1 rounded px-3 py-2 text-xs font-medium transition data-[state=active]:bg-zinc-100 data-[state=active]:shadow-none lg:flex-none lg:py-1.5"
        >
          Ventas
        </TabsTrigger>
        <TabsTrigger
          v-if="can('returns:review')"
          value="returns"
          class="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground dark:data-[state=active]:bg-muted flex-1 rounded px-3 py-2 text-xs font-medium transition data-[state=active]:bg-zinc-100 data-[state=active]:shadow-none lg:flex-none lg:py-1.5"
        >
          {{ returnedTabLabel }}
        </TabsTrigger>
      </TabsList>
      <!-- Sales -->
      <TabsContent
        value="sales"
        class="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0 focus-visible:outline-none"
      >
        <SalesList
          :sales="sales"
          :is-loading="isLoading"
          :error="error"
          :search="search"
          :show-new-sale="isSalesTab"
          @search-input="handleSearchInput"
          @clear-search="clearSearch"
          @refresh="refresh"
          @retry="refresh"
          @open-sale="handleOpenSale"
          @new-sale="handleNewSale"
        />
      </TabsContent>
      <!-- Returns -->
      <TabsContent
        v-if="can('returns:review')"
        value="returns"
        class="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0 focus-visible:outline-none"
      >
        <ReturnedUnitsList
          :units="returnedUnits"
          :is-loading="isLoadingReturnedUnits"
          :is-reviewing="returnsStore.isReviewing"
          :error="returnedUnitsError"
          @refresh="loadReturnedUnits"
          @retry="loadReturnedUnits"
          @approve="(unit) => openReview(unit, true)"
          @discard="(unit) => openReview(unit, false)"
          @reprint="handleReprint"
        />
      </TabsContent>
    </Tabs>
    <!-- Floating new sale button -->
    <Button
      v-if="isSalesTab && can('sales:create') && !error"
      size="icon"
      :class="[
        'fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 md:hidden',
        isScrollingDown
          ? 'pointer-events-none translate-y-4 opacity-0'
          : 'translate-y-0 opacity-100',
      ]"
      aria-label="Nueva venta"
      :disabled="isLoading"
      @click="handleNewSale"
    >
      <Plus class="size-5" />
    </Button>
    <!-- Sale detail (sheet/drawer) -->
    <SaleDetail
      v-model:open="isDetailOpen"
      :sale="selectedSale"
      @return-registered="handleReturnRegistered"
    />
    <!-- Review confirmation -->
    <ReturnReviewModal
      v-model:open="isReviewModalOpen"
      :unit="reviewTarget"
      :approve="reviewApprove"
      :is-submitting="returnsStore.isReviewing"
      :error="reviewError"
      @confirm="handleReviewConfirm"
    />
    <!-- QR reprint -->
    <ProductUnitsLabelsModal
      v-model:open="isLabelsModalOpen"
      :product="labelsProduct"
      :unit-ids="labelsUnitIds"
    />
  </div>
</template>
