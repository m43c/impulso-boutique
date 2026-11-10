import { h } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { filterFn_arrHas } from '@tanstack/vue-table'
import { EllipsisVertical, Eye, RotateCcw, XCircle } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    enableSorting: false,
    meta: {
      skeletonClass: 'h-10 w-10',
      cellClass: 'text-xs',
    },
    cell: (info) => {
      const id = info.getValue()

      const qrNode = h(
        'div',
        { class: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white p-1' },
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

      const textNode = h(Tooltip, () => [
        h(TooltipTrigger, { asChild: true }, () =>
          h(
            'button',
            {
              class:
                'border-muted-foreground/50 min-w-0 cursor-help border-b border-dashed font-mono',
            },
            id.slice(0, 8),
          ),
        ),
        h(TooltipContent, () => h('p', id)),
      ])

      return h('div', { class: 'flex items-center gap-3' }, [qrNode, textNode])
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    filterFn: filterFn_arrHas,
    enableGlobalFilter: false,
    sortingFn: (rowA, rowB, columnId) => {
      const a = formatUnitStatus(rowA.getValue(columnId))
      const b = formatUnitStatus(rowB.getValue(columnId))

      return a.localeCompare(b, 'es')
    },
    meta: {
      headerClass: 'justify-center',
      cellClass: 'text-center text-xs',
      skeletonClass: 'mx-auto h-5 w-20 rounded-full',
    },
    cell: (info) => {
      const status = info.getValue()

      return h(
        Badge,
        {
          variant: 'outline',
          class: `text-[11px] ${STATUS_STYLES[status] ?? ''}`,
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
      cellClass: 'text-center text-xs',
      skeletonClass: 'mx-auto h-4 w-16',
    },
    cell: (info) => formatDate(info.getValue()),
  },
  {
    accessorFn: (row) => formatMoveReason(row.origin_reason) || 'Sin origen',
    id: 'origin',
    header: 'Origen',
    filterFn: filterFn_arrHas,
    enableGlobalFilter: false,
    sortingFn: (rowA, rowB) => {
      const reasonA = rowA.original.origin_reason
        ? formatMoveReason(rowA.original.origin_reason)
        : 'Sin origen'
      const reasonB = rowB.original.origin_reason
        ? formatMoveReason(rowB.original.origin_reason)
        : 'Sin origen'
      return reasonA.localeCompare(reasonB, 'es')
    },
    meta: {
      skeletonClass: 'h-4 w-16',
      cellClass: 'text-xs',
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
      skeletonClass: 'mx-auto h-7 w-7 rounded-full',
    },
    cell: (info) => {
      const unit = info.row.original
      const meta = info.table.options.meta ?? {}

      const showExit = unit.status === 'available' && !!meta.canRegisterExit?.()
      const showReactivate = unit.status === 'unavailable' && !!meta.canReactivateUnit?.()

      const items = [
        // Show QR
        h(
          DropdownMenuItem,
          {
            'aria-label': `Ver QR de unidad ${unit.id.slice(0, 8)}`,
            class: 'cursor-pointer text-xs',
            onClick: () => meta.onViewQr?.(unit),
          },
          () => [h(Eye, { class: 'h-4 w-4' }), h('span', 'Ver QR')],
        ),
      ]
      // Register exit
      if (showExit) {
        items.push(
          h(
            DropdownMenuItem,
            {
              'aria-label': `Registrar salida de unidad ${unit.id.slice(0, 8)}`,
              class:
                'cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10',
              onClick: () => meta.onRegisterExit?.(unit),
            },
            () => [h(XCircle, { class: 'h-4 w-4 text-destructive' }), h('span', 'Dar de baja')],
          ),
        )
      }
      // Reactive unit
      if (showReactivate) {
        items.push(
          h(
            DropdownMenuItem,
            {
              'aria-label': `Reactivar unidad ${unit.id.slice(0, 8)}`,
              class:
                'cursor-pointer text-xs text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10',
              onClick: () => meta.onReactivateUnit?.(unit),
            },
            () => [h(RotateCcw, { class: 'h-4 w-4 text-emerald-500' }), h('span', 'Reactivar')],
          ),
        )
      }
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
        h(DropdownMenuContent, { align: 'end' }, () => items),
      ])
    },
  },
]
