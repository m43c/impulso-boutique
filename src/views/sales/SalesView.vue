<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import SalesList from '@/components/sales/SalesList.vue'
import SaleDetail from '@/components/sales/SaleDetail.vue'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const { can } = usePermissions()

const sales = ref([])
const isLoading = ref(false)
const error = ref(null)
const search = ref('')
const selectedSale = ref(null)
const isDetailOpen = ref(false)

const SEARCH_DEBOUNCE_MS = 300
let searchTimer = null
let requestId = 0

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

function handleSearchInput(value) {
  search.value = value
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadSales(value), SEARCH_DEBOUNCE_MS)
}

function clearSearch() {
  search.value = ''
  clearTimeout(searchTimer)
  loadSales('')
}

function refresh() {
  clearTimeout(searchTimer)
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
  loadSales('')
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  requestId++
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-6">
    <!-- Sales list -->
    <SalesList
      :sales="sales"
      :is-loading="isLoading"
      :error="error"
      :search="search"
      @search-input="handleSearchInput"
      @clear-search="clearSearch"
      @refresh="refresh"
      @retry="refresh"
      @open-sale="handleOpenSale"
      @new-sale="handleNewSale"
    />
    <!-- Floating new sale button -->
    <Button
      v-if="can('sales:create') && !error"
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
  </div>
</template>
