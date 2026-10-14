<script setup>
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { formatDateTime, formatRelativeDate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { IMAGE_SIZES } from '@/services/cloudinary'
import ProductImage from '@/components/products/ProductImage.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const kpis = {
  available: 0,
  sold: 0,
  unavailable: 0,
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <!-- Desktop view -->
    <div class="hidden flex-col gap-5 md:flex md:flex-row">
      <!-- Image -->
      <div class="w-48 shrink-0">
        <ProductImage
          :public-id="product.image_public_id"
          :alt="product.name"
          :size="IMAGE_SIZES.detail"
          image-class="w-full h-full rounded-lg object-cover aspect-square"
          fallback-class="bg-muted flex justify-center w-full h-full aspect-square items-center rounded-lg"
          icon-class="text-muted-foreground h-8 w-8"
        />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <!-- Name + Status -->
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg leading-tight font-semibold">{{ product.name }}</h3>
          <Badge
            variant="outline"
            class="shrink-0 text-[11px]"
            :class="
              product.is_active
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            "
          >
            {{ product.is_active ? 'Vigente' : 'Retirado' }}
          </Badge>
        </div>
        <!-- Description -->
        <p class="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {{ product.description || 'Sin descripción' }}
        </p>
        <div class="grid grid-cols-2 border-t pt-2 text-xs md:grid-cols-3 md:gap-4">
          <div class="flex flex-col gap-3">
            <!-- Category-->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Categoría:</p>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button class="min-w-0 cursor-default truncate">{{ product.category }}</button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ product.category }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Color -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Color:</p>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button class="min-w-0 cursor-default truncate">
                    {{ product.color || 'Sin color' }}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ product.color || 'Sin color' }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Price -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Precio:</p>
              <span class="min-w-0 font-semibold">
                {{ formatCurrency(product.price) }}
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <!-- Brand -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Marca:</p>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button class="min-w-0 cursor-default truncate">
                    {{ product.brand || 'Sin marca' }}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ product.brand || 'Sin marca' }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <!-- Size -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Talla:</p>
              <span class="min-w-0">{{ product.size || 'Sin talla' }}</span>
            </div>
            <!-- Min stock -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Stock mínimo:</p>
              <span class="min-w-0">{{ product.min_stock }}</span>
            </div>
          </div>
          <!-- KPIs -->
          <div class="col-span-2 flex flex-col gap-2 md:col-span-1">
            <div class="flex justify-between gap-2">
              <!-- Available -->
              <p class="text-muted-foreground shrink-0">Disponibles:</p>
              <Badge
                variant="outline"
                class="flex h-5 w-5 items-center justify-center rounded-full border-violet-500/30 bg-violet-500/10 p-0 text-[10px] font-semibold text-violet-400"
              >
                {{ kpis.available }}
              </Badge>
            </div>
            <!-- Sold -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">Vendidas:</p>
              <Badge
                variant="outline"
                class="flex h-5 w-5 items-center justify-center rounded-full border-blue-500/30 bg-blue-500/10 p-0 text-[10px] font-semibold text-blue-400"
              >
                {{ kpis.sold }}
              </Badge>
            </div>
            <!-- Unavailable -->
            <div class="flex justify-between gap-2">
              <p class="text-muted-foreground shrink-0">No disponibles:</p>
              <Badge
                variant="outline"
                class="flex h-5 w-5 items-center justify-center rounded-full border-amber-500/30 bg-amber-500/10 p-0 text-[10px] font-semibold text-amber-400"
              >
                {{ kpis.unavailable }}
              </Badge>
            </div>
          </div>
        </div>
        <!-- Date -->
        <div
          class="text-muted-foreground flex flex-col gap-2 border-t pt-2 text-xs sm:flex-row sm:justify-between"
        >
          <div class="flex items-center gap-1">
            <span>Creado:</span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button type="button" class="cursor-default">
                  {{ formatRelativeDate(product.created_at) }}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ formatDateTime(product.created_at) }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div class="flex items-center gap-1">
            <span>Actualizado:</span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button type="button" class="cursor-default">
                  {{ formatRelativeDate(product.updated_at) }}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ formatDateTime(product.updated_at) }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
    <!-- Mobile view -->
    <div class="flex w-full min-w-0 flex-col md:hidden">
      <!-- Name -->
      <h3 class="mb-3 text-sm leading-tight font-semibold">{{ product.name }}</h3>
      <!-- Image -->
      <div class="mb-3 flex gap-4">
        <ProductImage
          :public-id="product.image_public_id"
          :alt="product.name"
          :size="IMAGE_SIZES.detail"
          image-class="h-28 w-28 shrink-0 rounded-lg object-cover"
          fallback-class="bg-muted flex justify-center h-28 shrink-0 w-28 items-center rounded-lg"
          icon-class="text-muted-foreground h-6 w-6"
        />
        <!-- Details -->
        <div class="flex min-w-0 flex-1 flex-col gap-2 text-xs">
          <!-- Brand -->
          <div class="flex min-w-0 gap-2">
            <span class="text-muted-foreground shrink-0">Marca:</span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="min-w-0 cursor-default truncate">
                  {{ product.brand || 'Sin marca' }}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ product.brand || 'Sin marca' }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- Size -->
          <div class="flex gap-2">
            <span class="text-muted-foreground">Talla:</span>
            <span>{{ product.size || 'Sin talla' }}</span>
          </div>
          <!-- Color -->
          <div class="flex gap-2">
            <span class="text-muted-foreground">Color:</span>
            <span>{{ product.color || 'Sin color' }}</span>
          </div>
          <!-- Category -->
          <div class="flex min-w-0 gap-2">
            <span class="text-muted-foreground shrink-0">Categoria:</span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="min-w-0 cursor-default truncate">{{ product.category }}</button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ product.category }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- Status -->
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Estado:</span>
            <Badge
              variant="outline"
              class="h-5 px-1.5 py-0 text-[10px]"
              :class="
                product.is_active
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
              "
            >
              {{ product.is_active ? 'Vigente' : 'Retirado' }}
            </Badge>
          </div>
        </div>
      </div>
      <!-- Divisor -->
      <div class="mb-3 border-t"></div>
      <!-- KPIs -->
      <div class="grid grid-cols-3 gap-1">
        <!-- Available -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-8 w-8 rounded-full border-violet-500/30 bg-violet-500/10 text-sm font-semibold text-violet-400"
          >
            {{ kpis.available }}
          </Badge>
          <span class="mt-1 text-xs text-violet-500">Disponibles</span>
        </div>
        <!-- Sold -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-8 w-8 rounded-full border-blue-500/30 bg-blue-500/10 text-sm font-semibold text-blue-400"
          >
            {{ kpis.sold }}
          </Badge>
          <span class="mt-1 text-xs text-blue-500">Vendidos</span>
        </div>
        <!-- Unavailable -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-8 w-8 rounded-full border-amber-500/30 bg-amber-500/10 text-sm font-semibold text-amber-400"
          >
            {{ kpis.unavailable }}
          </Badge>
          <span class="mt-1 text-xs text-amber-500">No disponibles</span>
        </div>
      </div>
      <!-- Hidden details -->
      <Accordion type="single" collapsible class="mt-2 w-full">
        <AccordionItem value="details" class="border-b-0">
          <AccordionTrigger
            class="flex items-center justify-center gap-2 py-2 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180"
          >
            <span class="text-xs">Ver mas detalles</span>
          </AccordionTrigger>
          <AccordionContent class="flex min-w-0 flex-col gap-2 text-sm">
            <!-- Description -->
            <p class="text-muted-foreground text-xs leading-relaxed">
              {{ product.description || 'Sin descripción' }}
            </p>
            <div class="flex justify-between gap-2 text-xs">
              <!-- Price -->
              <div class="flex gap-2">
                <p class="text-muted-foreground">Precio:</p>
                <span class="font-semibold">{{ formatCurrency(product.price) }}</span>
              </div>
              <!-- Min stock -->
              <div class="flex gap-2">
                <p class="text-muted-foreground">Stock min.:</p>
                <span>{{ product.min_stock }}</span>
              </div>
            </div>
            <!-- Divisor -->
            <div class="border-t"></div>
            <!-- Date -->
            <div class="text-muted-foreground flex flex-col gap-1 text-[11px]">
              <span>Creado: {{ formatDateTime(product.created_at) }}</span>
              <span>Actualizado: {{ formatDateTime(product.updated_at) }}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </TooltipProvider>
</template>
