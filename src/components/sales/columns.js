import { h } from 'vue'
import { ChevronRight, Undo2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { formatDateTimeLaPaz } from '@/utils/date'
import { countReturnedUnits, formatReturnedMarker } from '@/utils/returns'
import { formatItemsCount, formatPaymentMethod, formatSaleTotal } from '@/utils/sales'

const PAYMENT_STYLES = {
  cash: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  qr_transfer: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  exchange: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
}

export function saleItemsPreview(sale) {
  const units = sale.units ?? []
  const names = units.map((unit) => unit.product_name).filter(Boolean)
  const total = Number(sale.items_count ?? names.length)

  if (!names.length) {
    return total > 0 ? formatItemsCount(total) : '—'
  }

  if (names.length <= 2) {
    return names.join(', ')
  }

  return `${names.slice(0, 2).join(', ')} +${total - 2}`
}

export const columns = [
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    enableGlobalFilter: false,
    meta: { skeletonClass: 'h-4 w-32', cellClass: 'max-w-[80px] text-xs' },
    cell: (info) => h('span', { class: 'whitespace-nowrap' }, formatDateTimeLaPaz(info.getValue())),
  },
  {
    id: 'items',
    accessorFn: (row) => saleItemsPreview(row),
    header: 'Productos',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { skeletonClass: 'h-4 w-44', cellClass: 'max-w-[260px] text-xs' },
    cell: (info) => {
      const count = Number(info.row.original.items_count ?? 0)
      const returned = countReturnedUnits(info.row.original)

      return h('div', { class: 'flex min-w-0 items-center gap-1' }, [
        h('span', { class: 'truncate' }, info.getValue()),
        count > 0 ? h('span', { class: 'text-muted-foreground shrink-0' }, `(${count})`) : null,
        returned > 0
          ? h(
              'span',
              {
                class:
                  'inline-flex shrink-0 items-center gap-0.5 text-xs text-amber-400 dark:text-amber-400',
                title: `${returned} ${returned === 1 ? 'unidad devuelta' : 'unidades devueltas'}`,
              },
              [
                h(Undo2, { class: 'h-3.5 w-3.5', 'aria-hidden': 'true' }),
                formatReturnedMarker(returned),
              ],
            )
          : null,
      ])
    },
  },
  {
    id: 'total_amount',
    accessorFn: (row) => Number(row.total_amount ?? 0),
    header: 'Total',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-end',
      skeletonClass: 'ml-auto h-4 w-16',
      cellClass: 'text-right text-xs',
    },
    cell: (info) =>
      h(
        'span',
        { class: 'font-medium whitespace-nowrap tabular-nums' },
        formatSaleTotal(info.getValue()),
      ),
  },
  {
    id: 'payment_method',
    accessorFn: (row) => formatPaymentMethod(row.payment_method),
    header: 'Pago',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      skeletonClass: 'mx-auto h-5 w-16 rounded-full',
      cellClass: 'text-center text-xs',
    },
    cell: (info) => {
      const method = info.row.original.payment_method
      const styleKey = method ?? 'exchange'

      return h(
        Badge,
        { variant: 'outline', class: [PAYMENT_STYLES[styleKey] ?? '', 'text-[11px]'] },
        () => formatPaymentMethod(method),
      )
    },
  },
  {
    id: 'open',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { skeletonClass: 'ml-auto h-4 w-4', cellClass: 'w-8 text-right' },
    cell: () => h(ChevronRight, { class: 'text-muted-foreground ml-auto h-4 w-4' }),
  },
]
