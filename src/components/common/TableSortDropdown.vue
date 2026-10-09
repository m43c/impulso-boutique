<script setup>
import { computed } from 'vue'
import { ArrowUpDown, Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps({
  table: {
    type: Object,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: 'Ordenar por',
  },
})

const activeSort = computed(() => {
  const sortingState = props.table.atoms.sorting.get()

  if (!sortingState || sortingState.length === 0) {
    return null
  }

  return sortingState[0]
})

function applySort(columnId, desc) {
  const column = props.table.getColumn(columnId)

  if (column) {
    column.toggleSorting(desc)
  }
}

function resetSort() {
  props.table.resetSorting()
}

function isOptionActive(option) {
  if (!activeSort.value) {
    return false
  }

  return (
    activeSort.value.id === option.columnId &&
    Boolean(activeSort.value.desc) === Boolean(option.desc)
  )
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon" class="shrink-0" aria-label="Opciones de orden">
        <ArrowUpDown class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>{{ title }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <template v-for="(option, index) in options" :key="index">
        <DropdownMenuItem
          class="cursor-pointer justify-between"
          :class="{ 'text-primary font-semibold': isOptionActive(option) }"
          @click="applySort(option.columnId, option.desc)"
        >
          <span>{{ option.label }}</span>
          <Check v-if="isOptionActive(option)" class="h-4 w-4 shrink-0" />
        </DropdownMenuItem>
        <DropdownMenuSeparator v-if="option.separator" />
      </template>
      <!-- Reset sorting -->
      <template v-if="activeSort">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-muted-foreground cursor-pointer justify-center text-xs"
          @click="resetSort()"
        >
          Restablecer orden
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
