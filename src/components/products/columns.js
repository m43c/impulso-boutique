import { h } from 'vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import {
  EllipsisVertical,
  Eye,
  ImageOff,
  PackageCheck,
  PackagePlus,
  PackageX,
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
import { buildImageUrl, IMAGE_SIZES } from '@/services/cloudinary'

export const columns = [
  {
    accessorKey: 'name',
    header: 'Producto',
    meta: {
      skeletonClass: 'h-8 w-48',
    },
    cell: (info) => {
      const product = info.row.original
      const name = info.getValue()
      const imagePublicId = product.image_public_id

      const imageNode = imagePublicId
        ? h('img', {
            src: buildImageUrl(imagePublicId, IMAGE_SIZES.thumb),
            alt: name,
            loading: 'lazy',
            decoding: 'async',
            class: 'h-10 w-10 shrink-0 rounded-md object-cover',
          })
        : h(
            'div',
            {
              class: 'bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
            },
            [
              h(ImageOff, {
                class: 'text-muted-foreground h-4 w-4',
              }),
            ],
          )

      const textNode = h(Tooltip, () => [
        h(
          TooltipTrigger,
          {
            asChild: true,
          },
          () =>
            h(
              'span',
              {
                class: 'max-w-40 truncate font-medium cursor-default',
              },
              name,
            ),
        ),
        h(TooltipContent, () => h('p', name)),
      ])

      return h(
        'div',
        {
          class: 'flex items-center gap-3',
        },
        [imageNode, textNode],
      )
    },
  },
  {
    accessorFn: (row) => normalizeText(row.category),
    id: 'category',
    header: 'Categoría',
    filterFn: filterFn_arrHas,
    meta: {
      cellClass: 'max-w-24 truncate',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) =>
      h(
        'span',
        {
          title: info.row.original.category,
        },
        info.row.original.category,
      ),
  },
  {
    accessorFn: (row) => normalizeText(row.brand),
    id: 'brand',
    header: 'Marca',
    filterFn: filterFn_arrHas,
    meta: {
      cellClass: 'max-w-24 truncate',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) =>
      h(
        'span',
        {
          title: info.row.original.brand,
        },
        info.row.original.brand || 'Sin marca',
      ),
  },
  {
    accessorFn: (row) => normalizeText(row.color),
    id: 'color',
    header: 'Color',
    filterFn: filterFn_arrHas,
    meta: {
      cellClass: 'truncate',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) => info.row.original.color || 'Sin color',
  },
  {
    accessorFn: (row) => normalizeText(row.size),
    id: 'size',
    header: 'Talla',
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-5 w-5',
    },
    cell: (info) => info.row.original.size || 'Sin talla',
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-end',
      cellClass: 'text-end',
      skeletonClass: 'ml-auto h-5 w-12',
    },
    cell: (info) => formatCurrency(info.getValue()),
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-5 w-16 rounded-full',
    },
    cell: (info) => {
      const isActive = info.getValue()

      return h(
        Badge,
        {
          variant: 'outline',
          class: isActive
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
            : 'border-rose-500/30 text-rose-400 bg-rose-500/10',
        },
        () => (isActive ? 'Vigente' : 'Retirado'),
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Creación',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-4 w-24',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorKey: 'updated_at',
    header: 'Actualización',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-4 w-24',
    },
    cell: (info) => {
      const val = info.getValue()

      return h(Tooltip, () => [
        h(
          TooltipTrigger,
          {
            asChild: true,
          },
          () =>
            h(
              'button',
              {
                type: 'button',
                class: 'cursor-default',
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
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-8 w-8 rounded-full',
    },
    cell: (info) => {
      const product = info.row.original
      const isActive = product.is_active

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
              class: 'cursor-pointer',
              onClick: () => info.table.options.meta?.onViewDetails?.(product),
            },
            () => [
              h(Eye, {
                class: 'mr-2 h-4 w-4',
              }),
              h('span', 'Ver detalles'),
            ],
          ),
          // Edit product
          h(
            DropdownMenuItem,
            {
              'aria-label': `Editar a ${product.name}`,
              class: 'cursor-pointer',
              onClick: () => info.table.options.meta?.onEdit?.(product),
            },
            () => [
              h(Pencil, {
                class: 'mr-2 h-4 w-4',
              }),
              h('span', 'Editar'),
            ],
          ),
          // Toggle status
          h(DropdownMenuSeparator),
          h(
            DropdownMenuItem,
            {
              'aria-label': isActive ? `Retirar ${product.name}` : `Reponer ${product.name}`,
              class: [
                'cursor-pointer',
                isActive
                  ? 'text-destructive focus:text-destructive focus:bg-destructive/10'
                  : 'text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10',
              ],
              onClick: () => info.table.options.meta?.onToggleStatus?.(product),
            },
            () => [
              h(isActive ? PackageX : PackageCheck, {
                class: ['mr-2 h-4 w-4', isActive ? 'text-destructive' : 'text-emerald-500'],
              }),
              h('span', isActive ? 'Retirar' : 'Reponer'),
            ],
          ),
        ]),
      ])
    },
  },
]
