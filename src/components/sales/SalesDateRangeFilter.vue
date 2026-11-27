<script setup>
import { computed, ref, watch } from 'vue'
import { DateFormatter, parseDate, today } from '@internationalized/date'
import { useMediaQuery } from '@vueuse/core'
import { Calendar as CalendarIcon, Check, Clock } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { LA_PAZ_TZ, laPazDateKey, laPazDayBounds } from '@/utils/date'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ preset: '24h', from: null, to: null }),
  },
})

const emit = defineEmits(['update:modelValue'])
const isDesktop = useMediaQuery('(min-width: 768px)')

const presets = [
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
]

const isOpen = ref(false)
const isCustomMode = ref(false)
const customFrom = ref('')
const customTo = ref('')
const fromOpen = ref(false)
const toOpen = ref(false)

const maxDate = today(LA_PAZ_TZ)

const fieldFormatter = new DateFormatter('es-BO', { dateStyle: 'medium' })

function makeDateModel(source) {
  return computed({
    get: () => (source.value ? parseDate(source.value) : undefined),
    set: (value) => {
      source.value = value ? value.toString() : ''
    },
  })
}

const fromDate = makeDateModel(customFrom)
const toDate = makeDateModel(customTo)

function formatField(date) {
  return date ? fieldFormatter.format(date.toDate(LA_PAZ_TZ)) : 'Seleccionar fecha'
}

const partsFormatter = new Intl.DateTimeFormat('es-BO', {
  timeZone: LA_PAZ_TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatLabelDate(date, withYear) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(date)).map((p) => [p.type, p.value]),
  )
  const base = `${parts.day} ${parts.month.replace('.', '')}`

  return withYear ? `${base} ${parts.year}` : base
}

function yearOf(date) {
  return laPazDateKey(date).slice(0, 4)
}

const label = computed(() => {
  const preset = props.modelValue?.preset ?? '24h'

  if (preset === 'custom' && props.modelValue?.from && props.modelValue?.to) {
    const from = new Date(props.modelValue.from)
    const lastDay = new Date(new Date(props.modelValue.to).getTime() - 1)

    if (laPazDateKey(from) === laPazDateKey(lastDay)) {
      return formatLabelDate(from, true)
    }

    const sameYear = yearOf(from) === yearOf(lastDay)

    return `${formatLabelDate(from, !sameYear)} – ${formatLabelDate(lastDay, true)}`
  }

  if (preset === 'today') {
    return formatLabelDate(today(LA_PAZ_TZ).toDate(LA_PAZ_TZ), true)
  }

  if (preset === 'yesterday') {
    return formatLabelDate(today(LA_PAZ_TZ).subtract({ days: 1 }).toDate(LA_PAZ_TZ), true)
  }

  return presets.find((p) => p.value === preset)?.label ?? 'Personalizado'
})

const isCustomValid = computed(() => {
  if (!customFrom.value || !customTo.value) {
    return false
  }

  return customFrom.value <= customTo.value
})

function openCustom() {
  isCustomMode.value = true
  customFrom.value = props.modelValue?.from ? laPazDateKey(props.modelValue.from) : ''
  customTo.value = props.modelValue?.to
    ? laPazDateKey(new Date(new Date(props.modelValue.to).getTime() - 1))
    : ''
}

function applyPreset(value) {
  isCustomMode.value = false
  emit('update:modelValue', { preset: value, from: null, to: null })
  isOpen.value = false
}

function applyCustom() {
  if (!isCustomValid.value) {
    return
  }

  const fromBounds = laPazDayBounds(new Date(`${customFrom.value}T12:00:00Z`))
  const toBounds = laPazDayBounds(new Date(`${customTo.value}T12:00:00Z`))

  emit('update:modelValue', {
    preset: 'custom',
    from: fromBounds.from,
    to: toBounds.to,
  })
  isOpen.value = false
}

watch(isOpen, (open) => {
  if (!open) {
    isCustomMode.value = false
    return
  }

  if (props.modelValue?.preset === 'custom') {
    openCustom()
  } else {
    isCustomMode.value = false
  }
})
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="mr-auto h-8 shrink-0 text-xs font-normal lg:mr-0"
        aria-label="Filtrar por rango de fechas"
      >
        <Clock class="h-3 w-3 shrink-0" />
        {{ label }}
      </Button>
    </PopoverTrigger>
    <PopoverContent :align="isDesktop ? 'end' : 'start'" class="w-60 p-2">
      <div class="flex flex-col gap-0.5">
        <button
          v-for="preset in presets"
          :key="preset.value"
          type="button"
          class="hover:bg-accent flex h-8 w-full items-center justify-between rounded-sm px-2 text-xs transition-colors"
          :class="{ 'text-primary font-medium': modelValue.preset === preset.value }"
          @click="applyPreset(preset.value)"
        >
          <span>{{ preset.label }}</span>
          <Check v-if="modelValue.preset === preset.value" class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="hover:bg-accent flex h-8 w-full items-center justify-between rounded-sm px-2 text-xs transition-colors"
          :class="{ 'text-primary font-medium': modelValue.preset === 'custom' }"
          @click="openCustom"
        >
          <span>Personalizado</span>
          <Check v-if="modelValue.preset === 'custom'" class="h-3.5 w-3.5" />
        </button>
      </div>
      <template v-if="isCustomMode">
        <Separator class="my-2" />
        <div class="grid gap-2 px-1 pb-1">
          <div class="grid gap-1">
            <Label class="text-muted-foreground text-[11px]">Desde</Label>
            <Popover v-model:open="fromOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
                  :class="{ 'text-muted-foreground': !fromDate }"
                >
                  <CalendarIcon class="h-3.5 w-3.5" />
                  {{ formatField(fromDate) }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar
                  v-model="fromDate"
                  locale="es-BO"
                  :week-starts-on="1"
                  :max-value="maxDate"
                  @update:model-value="fromOpen = false"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div class="grid gap-1">
            <Label class="text-muted-foreground text-[11px]">Hasta</Label>
            <Popover v-model:open="toOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
                  :class="{ 'text-muted-foreground': !toDate }"
                >
                  <CalendarIcon class="h-3.5 w-3.5" />
                  {{ formatField(toDate) }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar
                  v-model="toDate"
                  locale="es-BO"
                  :week-starts-on="1"
                  :min-value="fromDate"
                  :max-value="maxDate"
                  @update:model-value="toOpen = false"
                />
              </PopoverContent>
            </Popover>
          </div>
          <p v-if="customFrom && customTo && !isCustomValid" class="text-destructive text-[11px]">
            La fecha inicial no puede ser posterior a la final.
          </p>
          <Button
            size="sm"
            class="mt-1 h-8 text-xs"
            :disabled="!isCustomValid"
            @click="applyCustom"
          >
            Aplicar rango
          </Button>
        </div>
      </template>
    </PopoverContent>
  </Popover>
</template>
