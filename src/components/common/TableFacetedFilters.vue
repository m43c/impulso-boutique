<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Funnel } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { toTitleCase } from '@/utils/text'
import TableFacetedFiltersBody from './TableFacetedFiltersBody.vue'

const props = defineProps({
  table: {
    type: Object,
    required: true,
  },
  filterableColumns: {
    type: Array,
    required: true,
  },
})

const isDesktop = useMediaQuery('(min-width: 768px)')

const isOpen = defineModel('open', {
  type: Boolean,
  default: false,
})

function resolveOriginalCasingLabels(table, columnId) {
  const column = table.getColumn(columnId)
  const variantCounts = new Map()

  column?.getFacetedRowModel()?.flatRows.forEach((row) => {
    const normalizedValue = row.getValue(columnId)
    const originalValue = row.original[columnId]

    if (!normalizedValue || !originalValue) {
      return
    }

    if (!variantCounts.has(normalizedValue)) {
      variantCounts.set(normalizedValue, new Map())
    }

    const variants = variantCounts.get(normalizedValue)
    variants.set(originalValue, (variants.get(originalValue) ?? 0) + 1)
  })

  const labels = new Map()

  variantCounts.forEach((variants, normalizedValue) => {
    let bestLabel = null
    let bestCount = -1

    variants.forEach((count, variant) => {
      if (count > bestCount) {
        bestLabel = variant
        bestCount = count
      }
    })

    labels.set(normalizedValue, bestLabel)
  })

  return labels
}

const groups = computed(() =>
  props.filterableColumns.map(
    ({ columnId, label, getOptionLabel, emptyLabel, useOriginalCasing }) => {
      const column = props.table.getColumn(columnId)
      const facetedValues = column?.getFacetedUniqueValues() ?? new Map()
      const selected = column?.getFilterValue() ?? []

      const originalCasingLabels = useOriginalCasing
        ? resolveOriginalCasingLabels(props.table, columnId)
        : null

      function resolveLabel(value) {
        if (getOptionLabel) {
          return getOptionLabel(value)
        }

        if (!value) {
          return emptyLabel ?? ''
        }

        return originalCasingLabels?.get(value) ?? toTitleCase(value)
      }

      const options = [...facetedValues.entries()]
        .filter(([value]) => value || emptyLabel)
        .map(([value, count]) => ({
          value,
          label: resolveLabel(value),
          count,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      return { columnId, label, options, selected }
    },
  ),
)

const activeCount = computed(() =>
  groups.value.reduce((total, group) => total + group.selected.length, 0),
)

function handleToggle(columnId, value) {
  const column = props.table.getColumn(columnId)
  const current = column?.getFilterValue() ?? []
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]

  column?.setFilterValue(next.length ? next : undefined)
  props.table.setPageIndex(0)
}

function handleClear() {
  props.filterableColumns.forEach(({ columnId }) => {
    props.table.getColumn(columnId)?.setFilterValue(undefined)
  })
  props.table.setPageIndex(0)
}
</script>

<template>
  <!-- Desktop view -->
  <Popover v-if="isDesktop" v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button variant="outline" class="gap-2">
        <Funnel class="h-4 w-4" />
        Filtros
        <Badge v-if="activeCount" class="ml-1 h-4.5 w-4.5 text-[10px]">{{ activeCount }}</Badge>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-72 p-0" align="end">
      <TableFacetedFiltersBody :groups="groups" @toggle="handleToggle" @clear="handleClear" />
    </PopoverContent>
  </Popover>
  <!-- Mobile view -->
  <Drawer v-else v-model:open="isOpen">
    <Button variant="outline" size="icon" class="relative" @click="isOpen = true">
      <Funnel class="h-4 w-4" />
      <Badge
        v-if="activeCount"
        class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
      >
        {{ activeCount }}
      </Badge>
    </Button>
    <DrawerContent class="px-1 py-0">
      <DrawerHeader class="pt-1 pb-0 text-left">
        <DrawerTitle>Filtros</DrawerTitle>
      </DrawerHeader>
      <TableFacetedFiltersBody :groups="groups" @toggle="handleToggle" @clear="handleClear" />
    </DrawerContent>
  </Drawer>
</template>
