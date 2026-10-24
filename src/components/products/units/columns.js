import { h } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import { EllipsisVertical, Eye } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/utils/date'
import { formatUnitStatus } from '@/utils/productUnits'
import { formatMoveReason } from '@/utils/inventoryMoves'
import { buildUnitUrl } from '@/utils/urls'

const STATUS_STYLES = {
  available: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  sold: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  returned: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  unavailable: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
}

export const columns = [
  {
    accessorKey: 'id',
    id: 'code',
    header: 'Unidad',
    meta: {
      skeletonClass: 'h-10 w-80',
      cellClass: 'w-[360px]',
    },
    cell: (info) => {
      const id = info.getValue()

      const qrNode = h(
        'div',
        { class: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white p-1' },
        [
          h(QrcodeVue, {
            value: buildUnitUrl(id),
            size: 40,
            level: 'H',
            renderAs: 'svg',
            class: 'block h-full w-full',
          }),
        ],
      )

      const textNode = h(
        'span',
        { class: 'font-mono text-[13px] font-medium whitespace-nowrap select-all' },
        id,
      )

      return h('div', { class: 'flex items-center gap-3' }, [qrNode, textNode])
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    filterFn: filterFn_arrHas,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-5 w-20 rounded-full',
    },
    cell: (info) => {
      const status = info.getValue()

      return h(
        Badge,
        {
          variant: 'outline',
          class: STATUS_STYLES[status] ?? '',
        },
        () => formatUnitStatus(status),
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Ingreso',
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-4 w-20',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorFn: (row) => formatMoveReason(row.origin_reason) || 'Sin origen',
    id: 'origin',
    header: 'Origen',
    filterFn: filterFn_arrHas,
    meta: {
      skeletonClass: 'h-4 w-16',
    },
    cell: (info) => {
      const reason = info.row.original.origin_reason
      return reason ? formatMoveReason(reason) : 'Sin origen'
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center',
      skeletonClass: 'mx-auto h-8 w-8 rounded-full',
    },
    cell: (info) => {
      const unit = info.row.original

      return h(DropdownMenu, () => [
        h(DropdownMenuTrigger, { asChild: true }, () =>
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon',
              'aria-label': `Opciones para unidad ${unit.id.slice(0, 8)}`,
              class: 'h-8 w-8 rounded-full',
            },
            () => h(EllipsisVertical, { class: 'h-4 w-4' }),
          ),
        ),
        // Show QR
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(
            DropdownMenuItem,
            {
              'aria-label': `Ver QR de unidad ${unit.id.slice(0, 8)}`,
              class: 'cursor-pointer',
              onClick: () => info.table.options.meta?.onViewQr?.(unit),
            },
            () => [h(Eye, { class: 'h-4 w-4' }), h('span', 'Ver QR')],
          ),
        ]),
      ])
    },
  },
]
