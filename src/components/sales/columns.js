import { h } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { formatDateTimeLaPaz } from '@/utils/date'
import { formatItemsCount, formatPaymentMethod, formatSaleTotal } from '@/utils/sales'

const PAYMENT_STYLES = {
  cash: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  qr_transfer: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
}

export function saleItemsPreview(sale) {
  const lines = sale.lines ?? []
  const names = lines.map((line) => line.product_name).filter(Boolean)
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
    header: 'Prendas',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { skeletonClass: 'h-4 w-44', cellClass: 'max-w-[260px] text-xs' },
    cell: (info) => {
      const count = Number(info.row.original.items_count ?? 0)

      return h('div', { class: 'flex min-w-0 items-center gap-1' }, [
        h('span', { class: 'truncate' }, info.getValue()),
        count > 0 ? h('span', { class: 'text-muted-foreground shrink-0' }, `(${count})`) : null,
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

      return h(
        Badge,
        { variant: 'outline', class: [PAYMENT_STYLES[method] ?? '', 'text-[11px]'] },
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
