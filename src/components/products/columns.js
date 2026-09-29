import { h } from 'vue'
import { EllipsisVertical, Eye, ImageOff, PackageX, Pencil } from '@lucide/vue'
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
      const imageUrl = product.image_url

      const imageNode = imageUrl
        ? h('img', {
            src: imageUrl,
            alt: name,
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
    accessorKey: 'category',
    header: 'Categoría',
    meta: {
      skeletonClass: 'h-4 w-20',
      cellClass: 'max-w-24 truncate',
    },
    cell: (info) =>
      h(
        'span',
        {
          title: info.getValue(),
        },
        info.getValue(),
      ),
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
    meta: {
      skeletonClass: 'h-4 w-20',
      cellClass: 'max-w-24 truncate',
    },
    cell: (info) =>
      h(
        'span',
        {
          title: info.getValue(),
        },
        info.getValue() || '—',
      ),
  },
  {
    accessorKey: 'color',
    header: 'Color',
    meta: {
      cellClass: 'truncate',
      skeletonClass: 'h-4 w-20',
    },
    cell: (info) => info.getValue() || '—',
  },
  {
    accessorKey: 'size',
    header: 'Talla',
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-5 w-5',
      cellClass: 'text-center',
    },
    cell: (info) => info.getValue() || '—',
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    meta: {
      headerClass: 'justify-end',
      skeletonClass: 'ml-auto h-5 w-12',
      cellClass: 'text-end',
    },
    cell: (info) => formatCurrency(info.getValue()),
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    meta: {
      headerClass: 'justify-text',
      skeletonClass: 'mx-auto h-5 w-16 rounded-full',
      cellClass: 'text-text',
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
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-24',
      cellClass: 'text-center',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorKey: 'updated_at',
    header: 'Actualización',
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-4 w-24',
      cellClass: 'text-center',
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
      skeletonClass: 'mx-auto h-8 w-8 rounded-full',
      cellClass: 'text-center',
    },
    cell: (info) => {
      const product = info.row.original

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
              onClick: () => console.log('Ver detalles:', product),
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
              onClick: () => console.log('Editar:', product),
            },
            () => [
              h(Pencil, {
                class: 'mr-2 h-4 w-4',
              }),
              h('span', 'Editar'),
            ],
          ),
          // Delete product
          h(DropdownMenuSeparator),
          h(
            DropdownMenuItem,
            {
              'aria-label': `Retirar ${product.name}`,
              class:
                'text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer',
              onClick: () => console.log('Desactivar:', product),
            },
            () => [
              h(PackageX, {
                class: 'mr-2 h-4 w-4 text-destructive',
              }),
              h('span', 'Retirar '),
            ],
          ),
        ]),
      ])
    },
  },
]
