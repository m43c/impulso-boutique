<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  CheckCircle2,
  CircleAlert,
  EllipsisVertical,
  Loader2,
  Printer,
  RefreshCw,
  Undo2,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ProductImage from '@/components/products/ProductImage.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatReturnReason, formatReturnReplacement, formatReturnType } from '@/utils/returns'

const props = defineProps({
  units: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isReviewing: { type: Boolean, default: false },
  error: { type: String, default: null },
  count: { type: Number, default: null },
})

const emit = defineEmits(['refresh', 'retry', 'approve', 'discard', 'reprint'])

const isDesktop = useMediaQuery('(min-width: 768px)')

const displayCount = computed(() => props.count ?? props.units.length)

function variantLabel(unit) {
  return [unit.color, unit.size].filter(Boolean).join(' · ')
}

function dateLabel(unit) {
  return unit.return_created_at ? formatDateTimeLaPaz(unit.return_created_at) : '—'
}

function replacementLabel(unit) {
  return formatReturnReplacement(unit)
}

function emitAction(action, unit) {
  if (props.isReviewing) {
    return
  }

  emit(action, unit)
}
</script>

<template>
  <div
    class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 pb-6 lg:h-[calc(100dvh-8rem)] lg:flex-none lg:overflow-hidden lg:pb-0"
  >
    <!-- Error message -->
    <div v-if="error" class="flex flex-1 flex-col items-center justify-center text-center">
      <div class="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
        <CircleAlert />
      </div>
      <h3 class="text-sm font-semibold">{{ error }}</h3>
      <p class="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">Inténtalo nuevamente</p>
      <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('retry')">
        <Loader2 v-if="isLoading" class="animate-spin" />
        <span class="lg:text-xs">Reintentar</span>
      </Button>
    </div>
    <template v-else>
      <!-- Toolbar -->
      <div class="flex shrink-0 items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          class="shrink-0 p-2!"
          :disabled="isLoading"
          aria-label="Actualizar devoluciones"
          @click="emit('refresh')"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        </Button>
      </div>
      <!-- Desktop view -->
      <div
        v-if="isDesktop"
        class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border"
      >
        <div class="relative isolate flex-1 overflow-auto">
          <Table class="border-separate border-spacing-0">
            <TableHeader class="sticky top-0 z-10">
              <TableRow>
                <TableHead class="bg-background/95 border-b backdrop-blur">Unidad</TableHead>
                <TableHead class="bg-background/95 border-b backdrop-blur">Devuelta</TableHead>
                <TableHead class="bg-background/95 border-b backdrop-blur">Tipo</TableHead>
                <TableHead class="bg-background/95 border-b backdrop-blur">Pagó</TableHead>
                <TableHead class="bg-background/95 border-b text-right backdrop-blur">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Skeleton -->
              <template v-if="isLoading">
                <TableRow v-for="row in 6" :key="`sk-${row}`">
                  <TableCell class="border-b">
                    <div class="flex items-center gap-3">
                      <Skeleton class="h-12 w-12 rounded-md" />
                      <div class="flex flex-col gap-2">
                        <Skeleton class="h-3.5 w-40" />
                        <Skeleton class="h-3 w-28" />
                        <Skeleton class="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="border-b">
                    <div class="flex flex-col gap-2">
                      <Skeleton class="h-3.5 w-32" />
                      <Skeleton class="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell class="border-b"><Skeleton class="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell class="border-b"><Skeleton class="h-4 w-16" /></TableCell>
                  <TableCell class="border-b">
                    <div class="flex justify-end gap-2">
                      <Skeleton class="h-7 w-16 rounded-md" />
                      <Skeleton class="h-7 w-20 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              </template>
              <!-- Rows -->
              <template v-else>
                <TableRow v-for="unit in units" :key="unit.unit_id">
                  <TableCell class="max-w-90 border-b align-top">
                    <div class="flex items-start gap-3">
                      <ProductImage
                        :public-id="unit.image_public_id"
                        :alt="unit.product_name"
                        :size="IMAGE_SIZES.thumb"
                        image-class="h-12 w-12 shrink-0 rounded-md object-cover"
                        fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                      />
                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <p class="truncate text-xs font-medium">{{ unit.product_name }}</p>
                          <Badge
                            v-if="unit.product_is_active === false"
                            variant="outline"
                            class="shrink-0 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-400"
                          >
                            Retirado
                          </Badge>
                        </div>
                        <p
                          v-if="variantLabel(unit)"
                          class="text-muted-foreground mt-1 truncate text-xs"
                        >
                          {{ variantLabel(unit) }}
                        </p>
                        <p class="text-muted-foreground mt-0.5 font-mono text-[11px]">
                          {{ unit.unit_code }}
                        </p>
                        <p
                          v-if="replacementLabel(unit)"
                          class="text-muted-foreground mt-1 truncate text-[11px]"
                          :title="replacementLabel(unit)"
                        >
                          Por: {{ replacementLabel(unit) }}
                        </p>
                        <p
                          v-if="unit.return_profile_name"
                          class="text-muted-foreground mt-1 truncate text-[11px]"
                        >
                          Registró: {{ unit.return_profile_name }}
                        </p>
                        <p
                          v-if="unit.return_note"
                          class="text-muted-foreground mt-1 truncate text-[11px] italic"
                          :title="unit.return_note"
                        >
                          Nota: {{ unit.return_note }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="border-b align-top">
                    <p class="text-xs">{{ dateLabel(unit) }}</p>
                    <p class="text-muted-foreground mt-1 text-xs">
                      {{ formatReturnReason(unit.return_reason) }}
                    </p>
                  </TableCell>
                  <TableCell class="border-b align-top">
                    <Badge
                      variant="outline"
                      class="text-[11px]"
                      :class="
                        unit.return_type === 'exchange'
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      "
                    >
                      {{ formatReturnType(unit.return_type) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="border-b align-top">
                    <span class="text-xs font-medium tabular-nums">
                      {{ formatCurrency(unit.unit_price) }}
                    </span>
                  </TableCell>
                  <TableCell class="border-b align-top">
                    <div class="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        class="h-7 px-2 text-[11px]"
                        :disabled="isReviewing"
                        @click="emitAction('approve', unit)"
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        class="text-destructive hover:text-destructive h-7 px-2 text-[11px]"
                        :disabled="isReviewing"
                        @click="emitAction('discard', unit)"
                      >
                        Descartar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-7 w-7 shrink-0 rounded-full"
                            :aria-label="`Opciones para unidad ${unit.unit_code}`"
                          >
                            <EllipsisVertical class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem class="cursor-pointer" @click="emit('reprint', unit)">
                            <Printer class="h-4 w-4" />
                            <span>Reimprimir QR</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
          <!-- Empty state -->
          <div
            v-if="!isLoading && !units.length"
            class="absolute inset-x-0 top-10 bottom-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
              <CheckCircle2 class="h-9 w-9" />
            </div>
            <h3 class="text-sm font-semibold">No hay devoluciones pendientes de revisión</h3>
            <p class="text-muted-foreground max-w-xs text-xs">
              Las unidades devueltas aparecerán aquí hasta que las revises.
            </p>
          </div>
        </div>
      </div>
      <!-- Mobile view -->
      <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
        <!-- Skeleton -->
        <template v-if="isLoading">
          <Card v-for="card in 5" :key="`sk-card-${card}`" class="py-0">
            <CardContent class="flex flex-col gap-3 p-4">
              <div class="flex items-start gap-3">
                <Skeleton class="h-12 w-12 rounded-md" />
                <div class="flex flex-1 flex-col gap-2">
                  <Skeleton class="h-3.5 w-40" />
                  <Skeleton class="h-3 w-28" />
                  <Skeleton class="h-3 w-20" />
                </div>
                <Skeleton class="h-8 w-8 rounded-full" />
              </div>
              <Skeleton class="h-3.5 w-40" />
              <Skeleton class="h-3 w-32" />
              <div class="flex gap-2">
                <Skeleton class="h-8 flex-1 rounded-md" />
                <Skeleton class="h-8 flex-1 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </template>
        <template v-else-if="units.length">
          <Card v-for="unit in units" :key="unit.unit_id" class="py-0">
            <CardContent class="flex flex-col gap-2 p-4">
              <div class="flex items-start gap-3">
                <ProductImage
                  :public-id="unit.image_public_id"
                  :alt="unit.product_name"
                  :size="IMAGE_SIZES.thumb"
                  image-class="h-12 w-12 shrink-0 rounded-md object-cover"
                  fallback-class="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p class="truncate text-sm font-medium">{{ unit.product_name }}</p>
                    <Badge
                      v-if="unit.product_is_active === false"
                      variant="outline"
                      class="shrink-0 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-400"
                    >
                      Retirado
                    </Badge>
                  </div>
                  <p v-if="variantLabel(unit)" class="text-muted-foreground mt-1 truncate text-xs">
                    {{ variantLabel(unit) }}
                  </p>
                  <p class="text-muted-foreground mt-0.5 font-mono text-[11px]">
                    {{ unit.unit_code }}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="-mt-1 -mr-2.5 h-8 w-8 shrink-0 rounded-full"
                      :aria-label="`Opciones para unidad ${unit.unit_code}`"
                    >
                      <EllipsisVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem class="cursor-pointer" @click="emit('reprint', unit)">
                      <Printer class="h-4 w-4" />
                      <span>Reimprimir QR</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground text-xs">Devuelta {{ dateLabel(unit) }}</span>
                <Badge
                  variant="outline"
                  class="text-[11px]"
                  :class="
                    unit.return_type === 'exchange'
                      ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  "
                >
                  {{ formatReturnType(unit.return_type) }}
                </Badge>
              </div>
              <p class="text-xs">{{ formatReturnReason(unit.return_reason) }}</p>
              <p v-if="replacementLabel(unit)" class="text-muted-foreground text-xs">
                Por: {{ replacementLabel(unit) }}
              </p>
              <p v-if="unit.return_profile_name" class="text-muted-foreground text-xs">
                Registró: {{ unit.return_profile_name }}
              </p>
              <p class="text-xs font-medium tabular-nums">
                Pagó {{ formatCurrency(unit.unit_price) }}
              </p>
              <p v-if="unit.return_note" class="text-muted-foreground text-xs italic">
                Nota: {{ unit.return_note }}
              </p>
              <div class="flex gap-2 pt-1">
                <Button
                  class="flex-1"
                  size="sm"
                  :disabled="isReviewing"
                  @click="emitAction('approve', unit)"
                >
                  Aprobar
                </Button>
                <Button
                  variant="outline"
                  class="text-destructive hover:text-destructive flex-1"
                  size="sm"
                  :disabled="isReviewing"
                  @click="emitAction('discard', unit)"
                >
                  Descartar
                </Button>
              </div>
            </CardContent>
          </Card>
        </template>
        <!-- Empty state -->
        <div v-else class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <div class="bg-muted text-muted-foreground mb-2 rounded-full p-3">
            <Undo2 class="h-9 w-9" />
          </div>
          <h3 class="text-sm font-semibold">No hay devoluciones pendientes de revisión</h3>
          <p class="text-muted-foreground max-w-xs text-xs">
            Las unidades devueltas aparecerán aquí hasta que las revises.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
