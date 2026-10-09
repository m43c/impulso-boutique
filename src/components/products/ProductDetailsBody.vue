<script setup>
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-5">
      <div class="flex justify-center md:col-span-5 md:h-full">
        <ProductImage
          :public-id="product.image_public_id"
          :alt="product.name"
          :size="IMAGE_SIZES.detail"
          image-class="h-48 w-48 rounded-lg object-cover md:h-full md:w-full"
          fallback-class="bg-muted flex h-48 w-48 items-center justify-center rounded-lg md:h-full md:w-full"
          icon-class="text-muted-foreground h-8 w-8"
        />
      </div>
      <div class="flex flex-col gap-3 md:col-span-7">
        <!-- Name + status -->
        <div class="flex items-start justify-between gap-1">
          <h3 class="text-lg leading-tight font-semibold">{{ product.name }}</h3>
          <Badge
            variant="outline"
            class="shrink-0 text-[10px]"
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
        <p class="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {{ product.description || 'Sin descripción' }}
        </p>
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 text-sm">
          <!-- Category -->
          <div>
            <p class="text-muted-foreground text-xs">Categoría</p>
            <p class="font-medium">{{ product.category }}</p>
          </div>
          <!-- Brand -->
          <div>
            <p class="text-muted-foreground text-xs">Marca</p>
            <p class="font-medium">{{ product.brand || '—' }}</p>
          </div>
          <!-- Color -->
          <div>
            <p class="text-muted-foreground text-xs">Color</p>
            <p class="font-medium">{{ product.color || '—' }}</p>
          </div>
          <!-- Size -->
          <div>
            <p class="text-muted-foreground text-xs">Talla</p>
            <p class="font-medium">{{ product.size || '—' }}</p>
          </div>
          <div>
            <p class="text-muted-foreground text-xs">Precio</p>
            <p class="font-semibold">{{ formatCurrency(product.price) }}</p>
          </div>
          <!-- Min stock -->
          <div>
            <p class="text-muted-foreground text-xs">Stock mínimo</p>
            <p class="font-medium">{{ product.min_stock }}</p>
          </div>
        </div>
      </div>
      <div class="text-muted-foreground flex justify-between border-t pt-4 text-xs md:col-span-12">
        <!-- Create at -->
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
        <!-- Update at -->
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
  </TooltipProvider>
</template>
