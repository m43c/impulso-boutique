import { h } from 'vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import ProductImage from '@/components/products/ProductImage.vue'
import ReturnUnitActions from '@/components/sales/returns/ReturnUnitActions.vue'
import { IMAGE_SIZES } from '@/services/cloudinary'
import { formatCurrency } from '@/utils/currency'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatReturnReason, formatReturnReplacement, formatReturnType } from '@/utils/returns'
import { normalizeText } from '@/utils/text'

function variantLabel(unit) {
  return [unit.color, unit.size].filter(Boolean).join(' · ')
}

export const columns = [
  {
    id: 'product_name',
    accessorFn: (row) => normalizeText(row.product_name),
    header: 'Unidad',
    meta: {
      skeletonClass: 'h-12 w-96',
      cellClass: 'max-w-[360px] text-xs',
    },
    cell: (info) => {
      const unit = info.row.original
      const details = []

      details.push(
        h('div', { class: 'flex items-start gap-2 -mt-0.5' }, [
          // Product name
          h('p', { class: 'truncate text-xs font-medium' }, unit.product_name),
          unit.product_is_active === false
            ? h(
                Badge,
                {
                  variant: 'outline',
                  class: 'shrink-0 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-400',
                },
                () => 'Inactivo',
              )
            : null,
        ]),
      )

      // Color + size
      const variant = variantLabel(unit)

      if (variant) {
        details.push(h('p', { class: 'text-muted-foreground mt-0.5 truncate text-xs' }, variant))
      }

      details.push(
        h(
          'p',
          { class: 'text-muted-foreground mt-0.5 mb-1 font-mono text-[11px]' },
          unit.unit_code,
        ),
      )

      // Exchange
      const replacement = formatReturnReplacement(unit)

      if (replacement) {
        details.push(
          h(
            'p',
            {
              class: 'text-muted-foreground truncate text-[11px]',
              title: replacement,
            },
            `${replacement}`,
          ),
        )
      }

      // User
      if (unit.return_profile_name) {
        details.push(
          h(
            'p',
            { class: 'text-muted-foreground truncate text-[11px]' },
            `Registró: ${unit.return_profile_name}`,
          ),
        )
      }

      // Note
      if (unit.return_note) {
        details.push(
          h(
            'p',
            {
              class: 'text-muted-foreground mt-1 truncate text-[11px] italic',
              title: unit.return_note,
            },
            `Nota: ${unit.return_note}`,
          ),
        )
      }

      return h('div', { class: 'flex items-start gap-3' }, [
        h(ProductImage, {
          publicId: unit.image_public_id,
          alt: unit.product_name,
          size: IMAGE_SIZES.thumb,
          imageClass: 'h-12 w-12 shrink-0 rounded-md object-cover',
          fallbackClass: 'bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md',
        }),
        h('div', { class: 'min-w-0' }, details),
      ])
    },
  },
  {
    accessorKey: 'return_created_at',
    header: 'Devuelta',
    enableGlobalFilter: false,
    meta: {
      skeletonClass: 'h-8 w-32',
      cellClass: 'max-w-[150px] text-xs',
    },
    cell: (info) => {
      const unit = info.row.original

      return h('div', { class: 'flex flex-col gap-1' }, [
        h(
          'p',
          { class: 'whitespace-nowrap text-xs' },
          unit.return_created_at ? formatDateTimeLaPaz(unit.return_created_at) : '—',
        ),
        h('p', { class: 'text-muted-foreground text-xs' }, formatReturnReason(unit.return_reason)),
      ])
    },
  },
  {
    id: 'return_type',
    accessorFn: (row) => formatReturnType(row.return_type),
    header: 'Tipo',
    enableSorting: false,
    enableGlobalFilter: false,
    filterFn: filterFn_arrHas,
    meta: {
      skeletonClass: 'h-5 w-20 rounded-full',
      headerClass: 'justify-center',
      cellClass: 'max-w-[90px] text-xs text-center',
    },
    cell: (info) => {
      const type = info.row.original.return_type

      return h(
        Badge,
        {
          variant: 'outline',
          class: [
            'text-[11px]',
            type === 'exchange'
              ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          ],
        },
        () => formatReturnType(type),
      )
    },
  },
  {
    accessorKey: 'unit_price',
    header: 'Pagó',
    enableGlobalFilter: false,
    meta: {
      skeletonClass: 'h-4 w-16',
      cellClass: 'whitespace-nowrap text-xs',
    },
    cell: (info) =>
      h('span', { class: 'font-medium tabular-nums' }, formatCurrency(info.getValue())),
  },
  {
    id: 'actions',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-end',
      skeletonClass: 'ml-auto h-7 w-7 rounded-full mr-1',
      cellClass: 'text-right',
    },
    cell: (info) => {
      const meta = info.table.options.meta

      return h(ReturnUnitActions, {
        unit: info.row.original,
        reviewing: meta?.isReviewing,
        onApprove: () => meta?.onApprove?.(info.row.original),
        onDiscard: () => meta?.onDiscard?.(info.row.original),
        onReprint: () => meta?.onReprint?.(info.row.original),
      })
    },
  },
  {
    id: 'unit_search',
    accessorFn: (row) =>
      normalizeText(
        [row.product_name, row.unit_code, row.return_profile_name].filter(Boolean).join(' '),
      ),
    enableSorting: false,
    header: '',
    meta: {
      headerClass: 'hidden',
      cellClass: 'hidden',
    },
    cell: () => null,
  },
  {
    id: 'return_reason',
    accessorFn: (row) => formatReturnReason(row.return_reason),
    enableSorting: false,
    enableGlobalFilter: false,
    filterFn: filterFn_arrHas,
    header: '',
    meta: {
      headerClass: 'hidden',
      cellClass: 'hidden',
    },
    cell: () => null,
  },
  {
    id: 'return_profile_name',
    accessorFn: (row) => normalizeText(row.return_profile_name || ''),
    enableSorting: false,
    enableGlobalFilter: false,
    filterFn: filterFn_arrHas,
    header: '',
    meta: {
      headerClass: 'hidden',
      cellClass: 'hidden',
    },
    cell: () => null,
  },
]
