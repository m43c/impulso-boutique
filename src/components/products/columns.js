import { h } from 'vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import {
  CircleAlert,
  EllipsisVertical,
  Eye,
  LayersPlus,
  PlusCircle,
  XCircle,
  Pencil,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatDateTime, formatRelativeDate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { normalizeText } from '@/utils/text'
import { IMAGE_SIZES } from '@/services/cloudinary'
import ProductImage from '@/components/products/ProductImage.vue'

export const columns = [
  {
    accessorKey: 'name',
    header: 'Producto',
    meta: {
      skeletonClass: 'h-8 w-60',
      cellClass: 'text-xs max-w-[250px]',
    },
    cell: (info) => {
      const product = info.row.original
      const name = info.getValue()
      const imagePublicId = product.image_public_id

      const imageNode = h(ProductImage, {
        publicId: imagePublicId,
        alt: name,
        size: IMAGE_SIZES.thumb,
        imageClass: 'h-10 w-10 shrink-0 rounded-md object-cover',
        fallbackClass: 'bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
        iconClass: 'text-muted-foreground h-4 w-4',
      })

      const textNode = h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline-block max-w-full text-left border-muted-foreground/50 truncate cursor-help border-b border-dashed',
            },
            name,
          ),
        ),
        h(TooltipContent, () => h('p', {class: 'max-w-xs'}, name)),
      ])

      return h('div', { class: 'flex min-w-0 items-center gap-3 w-full' }, [imageNode, textNode])
    },
  },
  {
    accessorFn: (row) => normalizeText(row.category),
    id: 'category',
    header: 'Categoría',
    filterFn: filterFn_arrHas,
    meta: {
      cellClass: 'text-xs max-w-[120px]',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) => {
      const category = info.row.original.category

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline block max-w-full text-left border-muted-foreground/50 truncate cursor-help border-b border-dashed',
            },
            category,
          ),
        ),
        h(TooltipContent, () => h('p', category)),
      ])
    },
  },
  {
    accessorFn: (row) => normalizeText(row.brand),
    id: 'brand',
    header: 'Marca',
    filterFn: filterFn_arrHas,
    meta: {
      cellClass: 'text-xs max-w-[120px]',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) => {
      const brand = info.row.original.brand || 'Sin marca'

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline block max-w-full text-left border-muted-foreground/50 cursor-help border-b border-dashed ',
            },
            brand,
          ),
        ),
        h(TooltipContent, () => h('p', brand)),
      ])
    },
  },
  {
    accessorFn: (row) => normalizeText(row.color),
    id: 'color',
    header: 'Color',
    filterFn: filterFn_arrHas,
    meta: {
      cellClass: 'text-xs max-w-[120px]',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) => {
      const color = info.row.original.color || 'Sin color'

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'inline block max-w-full text-left border-muted-foreground/50 cursor-help border-b border-dashed',
            },
            color,
          ),
        ),
        h(TooltipContent, () => h('p', color)),
      ])
    },
  },
  {
    accessorFn: (row) => normalizeText(row.size),
    id: 'size',
    header: 'Talla',
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center text-xs max-w-[80px]',
      skeletonClass: 'mx-auto h-4 w-12',
    },
    cell: (info) => info.row.original.size || 'Sin talla',
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-end',
      cellClass: 'text-end text-xs max-w-[100px]',
      skeletonClass: 'ml-auto h-4 w-12',
    },
    cell: (info) => formatCurrency(info.getValue()),
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center text-xs max-w-[110px]',
      skeletonClass: 'mx-auto h-5 w-14 rounded-full',
    },
    cell: (info) => {
      const isActive = info.getValue()

      return h(
        Badge,
        {
          variant: 'outline',
          class: isActive
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px]'
            : 'border-rose-500/30 text-rose-400 bg-rose-500/10 text-[11px]',
        },
        () => (isActive ? 'Vigente' : 'Retirado'),
      )
    },
  },
  {
    id: 'stock',
    accessorFn: (row) => row.stock_available ?? 0,
    header: 'Stock',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center text-xs max-w-[70px]',
      skeletonClass: 'mx-auto h-5 w-8',
    },
    cell: (info) => {
      const s = info.row.original
      const available = info.row.original.stock_available ?? 0
      const low = info.row.original.is_low_stock
      const empty = available === 0

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'span',
            {
              class: [
                'inline-flex items-center gap-1 cursor-default tabular-nums',
                empty ? 'text-rose-400' : low ? 'text-amber-400' : '',
              ],
            },
            [available, low && !empty ? h(CircleAlert, { class: 'h-3.5 w-3.5' }) : null],
          ),
        ),
        h(TooltipContent, () =>
          h('div', { class: 'flex flex-col gap-0.5 text-xs' }, [
            h('p', `Disponibles: ${available}`),
            h('p', { class: 'text-muted-foreground' }, `Vendidos: ${s.stock_sold ?? 0}`),
            h('p', { class: 'text-muted-foreground' }, `Devueltos: ${s.stock_returned ?? 0}`),
            h(
              'p',
              { class: 'text-muted-foreground' },
              `No disponibles: ${s.stock_unavailable ?? 0}`,
            ),
            low && !empty
              ? h(
                  'p',
                  { class: 'text-amber-400 mt-1' },
                  `Stock mínimo: ${info.row.original.min_stock}`,
                )
              : null,
            empty ? h('p', { class: 'text-rose-400 mt-1' }, 'Sin stock') : null,
          ]),
        ),
      ])
    },
  },
  {
    id: 'stock_status',
    accessorFn: (row) => {
      const available = row.stock_available ?? 0
      const isLowStock = row.is_low_stock ?? false

      if (available === 0) {
        return 'Agotado'
      }

      if (isLowStock) {
        return 'Stock mínimo'
      }

      return 'Con stock'
    },
    filterFn: filterFn_arrHas,
    enableSorting: false,
    enableGlobalFilter: false,
    header: '',
    meta: {
      headerClass: 'hidden',
      cellClass: 'hidden',
    },
    cell: () => null,
  },
  {
    accessorKey: 'created_at',
    header: 'Creación',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center text-xs max-w-[80px]',
      skeletonClass: 'mx-auto h-4 w-16',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorKey: 'updated_at',
    header: 'Actualización',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center text-xs max-w-[100px]',
      skeletonClass: 'mx-auto h-4 w-20',
    },
    cell: (info) => {
      const val = info.getValue()

      return h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class: 'border-muted-foreground/50 min-w-0 cursor-help border-b border-dashed',
            },
            formatRelativeDate(val),
          ),
        ),
        h(TooltipContent, () => h('p', formatDateTime(val))),
      ])
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center max-w-[50px]',
      skeletonClass: 'mx-auto h-6 w-6 rounded-full',
    },
    cell: (info) => {
      const product = info.row.original
      const isActive = product.is_active
      const can = info.table.options.meta?.can

      const canCreate = can?.('products:create') ?? false
      const canUpdate = can?.('products:update') ?? false
      const canToggleStatus = can?.('products:toggle-status') ?? false

      return h(DropdownMenu, () => [
        h(
          DropdownMenuTrigger,
          {
            asChild: true,
          },
          () =>
            h(
              Button,
              {
                variant: 'ghost',
                size: 'icon',
                'aria-label': `Opciones para ${product.name}`,
                class: 'h-8 w-8 rounded-full',
              },
              () =>
                h(EllipsisVertical, {
                  class: 'h-4 w-4',
                }),
            ),
        ),
        h(DropdownMenuContent, { align: 'end' }, () => [
          // Show details
          h(
            DropdownMenuItem,
            {
              'aria-label': `Ver detalles de ${product.name}`,
              class: 'cursor-pointer text-xs',
              onClick: () => info.table.options.meta?.onViewDetails?.(product),
            },
            () => [
              h(Eye, {
                class: 'h-4 w-4',
              }),
              h('span', 'Ver detalles'),
            ],
          ),
          // Create variant
          canCreate &&
            h(
              DropdownMenuItem,
              {
                'aria-label': `Crear variante de ${product.name}`,
                class: 'cursor-pointer text-xs',
                onClick: () => info.table.options.meta?.onCreateVariant?.(product),
              },
              () => [
                h(LayersPlus, {
                  class: 'h-4 w-4',
                }),
                h('span', 'Crear variante'),
              ],
            ),
          // Edit product
          canUpdate &&
            h(
              DropdownMenuItem,
              {
                'aria-label': `Editar a ${product.name}`,
                class: 'cursor-pointer text-xs',
                onClick: () => info.table.options.meta?.onEdit?.(product),
              },
              () => [
                h(Pencil, {
                  class: 'h-4 w-4',
                }),
                h('span', 'Editar'),
              ],
            ),
          // Toggle status
          canToggleStatus && h(DropdownMenuSeparator),
          canToggleStatus &&
            h(
              DropdownMenuItem,
              {
                'aria-label': isActive ? `Retirar ${product.name}` : `Reponer ${product.name}`,
                class: [
                  'cursor-pointer text-xs',
                  isActive
                    ? 'text-destructive focus:text-destructive focus:bg-destructive/10'
                    : 'text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10',
                ],
                onClick: () => info.table.options.meta?.onToggleStatus?.(product),
              },
              () => [
                h(isActive ? XCircle : PlusCircle, {
                  class: ['h-4 w-4', isActive ? 'text-destructive' : 'text-emerald-500'],
                }),
                h('span', isActive ? 'Retirar' : 'Reponer'),
              ],
            ),
        ]),
      ])
    },
  },
]
