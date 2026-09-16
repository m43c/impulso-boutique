<script setup>
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
  UserPlus,
} from '@lucide/vue'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatRole } from '@/utils/roles'
import { formatDate, formatDateTime, formatRelativeDate } from '@/utils/date'
import { columns } from './columns'
import { features } from './features'

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['add-user', 'edit-user', 'retry'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const search = ref('')

watch(search, () => {
  table.setPageIndex(0)
})

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return props.users
  }

  return props.users.filter((user) => {
    const statusLabel = user.is_active ? 'activo' : 'inactivo'
    const haystack = [user.full_name, user.email, formatRole(user.role)].join(' ').toLowerCase()

    return haystack.includes(term) || statusLabel.startsWith(term)
  })
})

const table = useTable({
  features,
  get data() {
    return filteredUsers.value
  },
  columns,
  enableMultiSort: false,
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: isDesktop.value ? 10 : 5,
    },
  },
  meta: {
    onEdit: (user) => emit('edit-user', user),
  },
})

function sortIcon(column) {
  if (!column.getCanSort()) {
    return null
  }

  const state = column.getIsSorted()

  if (state === 'asc') {
    return ArrowUp
  }
  if (state === 'desc') {
    return ArrowDown
  }

  return ArrowUpDown
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="flex min-h-0 flex-1 flex-col gap-4">
      <!-- Error -->
      <div v-if="error" class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
          <CircleAlert />
        </div>
        <h3 class="text-base font-semibold">{{ error }}</h3>
        <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">Inténtalo nuevamente</p>
        <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
          <Loader2 v-if="isLoading" class="animate-spin" />
          Reintentar
        </Button>
      </div>
      <template v-else>
        <!-- Toolbar -->
        <div class="flex items-center justify-between gap-3">
          <div class="relative w-full">
            <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input v-model="search" placeholder="Buscar usuario..." class="pl-9" />
          </div>
          <Button class="hidden gap-2 md:flex" @click="emit('add-user')">
            <UserPlus class="h-4 w-4" />
            Agregar usuario
          </Button>
        </div>
        <!-- Desktop -->
        <div v-if="isDesktop" class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <TableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :class="[
                    header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                    header.column.columnDef.meta?.cellClass || '',
                  ]"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <div
                    class="flex items-center gap-1"
                    :class="header.column.columnDef.meta?.headerClass || 'justify-start'"
                  >
                    <FlexRender v-if="!header.isPlaceholder" :header="header" />
                    <component
                      :is="sortIcon(header.column)"
                      v-if="sortIcon(header.column)"
                      class="h-3.5 w-3.5"
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Skeleton -->
              <template v-if="isLoading">
                <TableRow v-for="row in 10" :key="`skeleton-${row}`">
                  <TableCell
                    v-for="column in columns"
                    :key="column.accessorKey || column.id"
                    :class="column.meta?.cellClass || ''"
                  >
                    <template v-if="column.accessorKey === 'email'">
                      <Skeleton class="h-4 w-44" />
                    </template>
                    <template v-else-if="column.accessorKey === 'full_name'">
                      <Skeleton class="h-4 w-32" />
                    </template>
                    <template v-else-if="column.accessorKey === 'role'">
                      <Skeleton class="h-4 w-20" />
                    </template>
                    <template v-else-if="column.accessorKey === 'is_active'">
                      <Skeleton class="mx-auto h-5 w-16 rounded-full" />
                    </template>
                    <template v-else-if="column.accessorKey === 'created_at'">
                      <Skeleton class="mx-auto h-4 w-24" />
                    </template>
                    <template v-else-if="column.accessorKey === 'updated_at'">
                      <Skeleton class="mx-auto h-4 w-24" />
                    </template>
                    <template v-else-if="column.id === 'actions'">
                      <Skeleton class="mx-auto h-8 w-8 rounded-full" />
                    </template>
                    <Skeleton v-else class="h-4 w-24" />
                  </TableCell>
                </TableRow>
              </template>
              <!-- Data -->
              <template v-else-if="table.getRowModel().rows?.length">
                <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                  <TableCell
                    v-for="cell in row.getAllCells()"
                    :key="cell.id"
                    :class="cell.column.columnDef.meta?.cellClass || ''"
                  >
                    <FlexRender :cell="cell" />
                  </TableCell>
                </TableRow>
              </template>
              <!-- Empty -->
              <template v-else>
                <TableRow>
                  <TableCell
                    :colspan="columns.length"
                    class="text-muted-foreground h-24 text-center"
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>
        <!-- Mobile -->
        <div v-else class="flex flex-col gap-4">
          <!-- Skeleton -->
          <template v-if="isLoading">
            <Card v-for="card in 5" :key="`skeleton-card-${card}`">
              <CardContent class="flex flex-col gap-2">
                <div class="flex justify-between">
                  <Skeleton class="h-5 w-36" />
                  <Skeleton class="h-6 w-6 rounded-full" />
                </div>
                <Skeleton class="h-4 w-48" />
                <div class="flex items-center justify-between">
                  <Skeleton class="h-4 w-20" />
                  <Skeleton class="h-5 w-16 rounded-full" />
                </div>
                <div class="flex flex-col gap-0.5 pt-2">
                  <Skeleton class="h-3 w-24" />
                  <Skeleton class="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          </template>
          <!-- Empty -->
          <p
            v-else-if="!table.getRowModel().rows?.length"
            class="text-muted-foreground py-8 text-center text-sm"
          >
            No se encontraron usuarios
          </p>
          <!-- Data -->
          <Card v-for="row in table.getRowModel().rows" v-else :key="row.id">
            <CardContent class="flex flex-col gap-1">
              <div class="flex justify-between">
                <p class="truncate font-medium">{{ row.original.full_name }}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 shrink-0 rounded-full"
                  :aria-label="`Editar a ${row.original.full_name}`"
                  @click="emit('edit-user', row.original)"
                >
                  <Pencil />
                </Button>
              </div>
              <p class="text-muted-foreground text-sm">{{ row.original.email }}</p>
              <div class="flex items-center justify-between text-sm">
                <span>{{ formatRole(row.original.role) }}</span>
                <Badge :variant="row.original.is_active ? 'success' : 'destructive'">
                  {{ row.original.is_active ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
              <div class="flex flex-col gap-0.5 pt-2">
                <div class="text-muted-foreground flex items-center gap-1 text-xs">
                  <span>Actualizado:</span>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button type="button" class="cursor-default">
                        {{ formatRelativeDate(row.original.updated_at) }}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ formatDateTime(row.original.updated_at) }}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p class="text-muted-foreground text-xs">
                  Creado: {{ formatDate(row.original.created_at) }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <!-- Pagination -->
        <div class="flex items-center justify-between">
          <p class="text-muted-foreground text-sm">
            Página {{ table.atoms.pagination.get().pageIndex + 1 }} de
            {{ Math.max(table.getPageCount(), 1) }}
          </p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanPreviousPage()"
              @click="table.previousPage()"
            >
              <ChevronLeft class="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanNextPage()"
              @click="table.nextPage()"
            >
              Siguiente
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </template>
    </div>
  </TooltipProvider>
</template>
