<script setup>
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { formatDateTime } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { IMAGE_SIZES } from '@/services/cloudinary'
import ProductImage from '@/components/products/ProductImage.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  stats: {
    type: Object,
    default: () => ({
      available: 0,
      sold: 0,
      unavailable: 0,
    }),
  },
})
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <!-- Desktop view -->
    <div class="hidden flex-col gap-4 lg:flex">
      <div class="flex flex-col gap-2">
        <!-- Name -->
        <h3 class="text-base font-semibold">
          {{ product.name }}
        </h3>
        <!-- Description -->
        <p class="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {{ product.description || 'Sin descripción' }}
        </p>
      </div>
      <div class="flex items-start gap-5">
        <!-- Image -->
        <div
          class="mx-auto aspect-5/5 w-32 shrink-0 overflow-hidden rounded-lg lg:w-52 lg:rounded-sm"
        >
          <ProductImage
            :public-id="product.image_public_id"
            :alt="product.name"
            :size="IMAGE_SIZES.detail"
            image-class="h-full w-full object-cover"
            fallback-class="bg-muted flex justify-center h-full w-full items-center"
            icon-class="text-muted-foreground h-8 w-8"
          />
        </div>
        <!-- Details -->
        <div class="flex min-w-0 flex-1 flex-col gap-3 text-sm">
          <!-- Category -->
          <div class="flex min-w-0 justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Categoria</span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="min-w-0 cursor-default truncate">{{ product.category }}</button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ product.category }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- Brand -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Marca</span>
            <span class="min-w-0 truncate">{{ product.brand || 'Sin marca' }}</span>
          </div>
          <!-- Color -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Color</span>
            <span class="min-w-0 truncate">{{ product.color || 'Sin color' }}</span>
          </div>
          <!-- Size -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Talla</span>
            <span class="min-w-0 truncate">{{ product.size || 'Sin talla' }}</span>
          </div>
          <!-- Price -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Precio</span>
            <span class="min-w-0 truncate font-semibold">{{ formatCurrency(product.price) }}</span>
          </div>
          <!-- Min stock -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Stock mín.</span>
            <span class="min-w-0 truncate">{{ product.min_stock }}</span>
          </div>
          <!-- Status -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Estado</span>
            <Badge
              variant="outline"
              class="shrink-0 text-xs"
              :class="
                product.is_active
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              "
            >
              {{ product.is_active ? 'Vigente' : 'Retirado' }}
            </Badge>
          </div>
        </div>
      </div>
      <!-- KPIs -->
      <div class="flex justify-evenly gap-2 border-y py-4">
        <!-- Available -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-10 w-10 rounded-full border-violet-500/30 bg-violet-500/10 text-sm font-semibold text-violet-400"
          >
            {{ stats.available }}
          </Badge>
          <span class="mt-1 text-xs text-violet-500">Disponibles</span>
        </div>
        <!-- Sold -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-10 w-10 rounded-full border-blue-500/30 bg-blue-500/10 text-sm font-semibold text-blue-400"
          >
            {{ stats.sold }}
          </Badge>
          <span class="mt-1 text-xs text-blue-500">Vendidos</span>
        </div>
        <!-- Unavailable -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-10 w-10 rounded-full border-amber-500/30 bg-amber-500/10 text-sm font-semibold text-amber-400"
          >
            {{ stats.unavailable }}
          </Badge>
          <span class="mt-1 text-xs text-amber-500">No disponibles</span>
        </div>
      </div>
      <!-- Dates -->
      <div class="flex justify-between gap-2 text-xs">
        <div class="flex gap-2">
          <span class="text-muted-foreground">Creado:</span>
          <span>{{ formatDateTime(product.created_at) }}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-muted-foreground">Actualizado:</span>
          <span>{{ formatDateTime(product.updated_at) }}</span>
        </div>
      </div>
    </div>
    <!-- Mobile view -->
    <div class="flex w-full min-w-0 flex-col lg:hidden">
      <!-- Name -->
      <h3 class="mb-3 text-sm leading-tight font-semibold">{{ product.name }}</h3>
      <!-- Image -->
      <div class="mb-3 flex gap-4">
        <ProductImage
          :public-id="product.image_public_id"
          :alt="product.name"
          :size="IMAGE_SIZES.detail"
          image-class="aspect-5/5 w-32 shrink-0 rounded-lg object-cover"
          fallback-class="bg-muted flex justify-center h-28 shrink-0 w-28 items-center rounded-lg"
          icon-class="text-muted-foreground h-6 w-6"
        />
        <!-- Details -->
        <div class="flex min-w-0 flex-1 flex-col gap-2.5 text-xs">
          <!-- Category -->
          <div class="flex min-w-0 justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Categoría</span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="min-w-0 cursor-default truncate">{{ product.category }}</button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{{ product.category }}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- Brand -->
          <div class="flex min-w-0 justify-between gap-2">
            <span class="text-muted-foreground shrink-0">Marca</span>
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
          <!-- Color -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground">Color:</span>
            <span>{{ product.color || 'Sin color' }}</span>
          </div>
          <!-- Size -->
          <div class="flex justify-between gap-2">
            <span class="text-muted-foreground">Talla:</span>
            <span>{{ product.size || 'Sin talla' }}</span>
          </div>
          <!-- Status -->
          <div class="flex items-center justify-between gap-2">
            <span class="text-muted-foreground">Estado:</span>
            <Badge
              variant="outline"
              class="px-1.5 py-0.5 text-[11px]"
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
            {{ stats.available }}
          </Badge>
          <span class="mt-1 text-xs text-violet-500">Disponibles</span>
        </div>
        <!-- Sold -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-8 w-8 rounded-full border-blue-500/30 bg-blue-500/10 text-sm font-semibold text-blue-400"
          >
            {{ stats.sold }}
          </Badge>
          <span class="mt-1 text-xs text-blue-500">Vendidos</span>
        </div>
        <!-- Unavailable -->
        <div class="flex flex-col items-center">
          <Badge
            variant="outline"
            class="h-8 w-8 rounded-full border-amber-500/30 bg-amber-500/10 text-sm font-semibold text-amber-400"
          >
            {{ stats.unavailable }}
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
          <AccordionContent class="flex min-w-0 flex-col gap-2 pb-0! text-sm">
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
            <div class="text-muted-foreground flex flex-col gap-1 text-xs">
              <span>Creado: {{ formatDateTime(product.created_at) }}</span>
              <span>Actualizado: {{ formatDateTime(product.updated_at) }}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </TooltipProvider>
</template>
