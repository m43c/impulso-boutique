<script setup>
import { getLocalTimeZone, today } from '@internationalized/date'
import { createReusableTemplate, reactiveOmit, useVModel } from '@vueuse/core'
import { cn } from 'cn'
import { CalendarRoot, useDateFormatter, useForwardPropsEmits, useLocale } from 'reka-ui'
import { createYear, createYearRange, toDate } from 'reka-ui/date'
import { computed, toRaw, toRef, watch } from 'vue'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from '.'

const props = defineProps({
  defaultValue: { type: Object, required: false },
  defaultPlaceholder: { type: Object, required: false },
  placeholder: { type: Object, required: false },
  pagedNavigation: { type: Boolean, required: false },
  preventDeselect: { type: Boolean, required: false },
  weekStartsOn: { type: Number, required: false },
  weekdayFormat: { type: String, required: false },
  calendarLabel: { type: String, required: false },
  fixedWeeks: { type: Boolean, required: false },
  maxValue: { type: Object, required: false },
  minValue: { type: Object, required: false },
  locale: { type: String, required: false },
  numberOfMonths: { type: Number, required: false },
  disabled: { type: Boolean, required: false },
  readonly: { type: Boolean, required: false },
  initialFocus: { type: Boolean, required: false },
  isDateDisabled: { type: Function, required: false },
  isDateUnavailable: { type: Function, required: false },
  dir: { type: String, required: false },
  nextPage: { type: Function, required: false },
  prevPage: { type: Function, required: false },
  modelValue: {
    type: [Object, Array, null],
    required: false,
    default: undefined,
  },
  multiple: { type: Boolean, required: false },
  disableDaysOutsideCurrentView: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: [String, Object, Function], required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
  layout: { type: null, required: false, default: undefined },
  yearRange: { type: Array, required: false },
})
const emits = defineEmits(['update:modelValue', 'update:placeholder'])

const delegatedProps = reactiveOmit(props, 'class', 'layout', 'placeholder')

const placeholder = useVModel(props, 'placeholder', emits, {
  passive: true,
  defaultValue: props.defaultPlaceholder ?? today(getLocalTimeZone()),
})

const locale = useLocale(toRef(() => props.locale))
const formatter = useDateFormatter(locale.value)
watch(locale, (value) => formatter.setLocale(value))

const yearRange = computed(() => {
  return (
    props.yearRange ??
    createYearRange({
      start:
        props?.minValue ??
        (toRaw(props.placeholder) ?? props.defaultPlaceholder ?? today(getLocalTimeZone())).cycle(
          'year',
          -100,
        ),
      end:
        props?.maxValue ??
        (toRaw(props.placeholder) ?? props.defaultPlaceholder ?? today(getLocalTimeZone())).cycle(
          'year',
          10,
        ),
    })
  )
})

const [DefineMonthTemplate, ReuseMonthTemplate] = createReusableTemplate()
const [DefineYearTemplate, ReuseYearTemplate] = createReusableTemplate()

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DefineMonthTemplate v-slot="{ date }">
    <div class="**:data-[slot=native-select-icon]:right-1">
      <div class="relative">
        <div class="pointer-events-none absolute inset-0 flex h-full items-center pl-2 text-sm">
          {{
            formatter.custom(toDate(date), {
              month: 'short',
              calendar: date.calendar.identifier,
            })
          }}
        </div>
        <NativeSelect
          class="relative h-8 pr-6 pl-2 text-xs text-transparent"
          :model-value="date.month"
          @change="
            (e) => {
              placeholder = placeholder.set({
                month: Number(e?.target?.value),
              })
            }
          "
        >
          <NativeSelectOption
            v-for="month in createYear({ dateObj: date })"
            :key="month.toString()"
            :value="month.month"
            :selected="date.month === month.month"
          >
            {{
              formatter.custom(toDate(month), {
                month: 'short',
                calendar: month.calendar.identifier,
              })
            }}
          </NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  </DefineMonthTemplate>

  <DefineYearTemplate v-slot="{ date }">
    <div class="**:data-[slot=native-select-icon]:right-1">
      <div class="relative">
        <div class="pointer-events-none absolute inset-0 flex h-full items-center pl-2 text-sm">
          {{
            formatter.custom(toDate(date), {
              year: 'numeric',
              calendar: date.calendar.identifier,
            })
          }}
        </div>
        <NativeSelect
          class="relative h-8 pr-6 pl-2 text-xs text-transparent"
          :model-value="date.year"
          @change="
            (e) => {
              placeholder = placeholder.set({ year: Number(e?.target?.value) })
            }
          "
        >
          <NativeSelectOption
            v-for="year in yearRange"
            :key="year.toString()"
            :value="year.year"
            :selected="date.year === year.year"
          >
            {{
              formatter.custom(toDate(year), {
                year: 'numeric',
                calendar: year.calendar.identifier,
              })
            }}
          </NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  </DefineYearTemplate>

  <CalendarRoot
    v-slot="{ grid, weekDays, date }"
    v-bind="forwarded"
    v-model:placeholder="placeholder"
    data-slot="calendar"
    :class="cn('p-3', props.class)"
  >
    <CalendarHeader class="pt-0">
      <slot
        name="calendar-heading"
        :date="date"
        :month="ReuseMonthTemplate"
        :year="ReuseYearTemplate"
      >
        <template v-if="layout === 'month-and-year'">
          <div class="flex items-center justify-center gap-1">
            <ReuseMonthTemplate :date="date" />
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else-if="layout === 'month-only'">
          <div class="flex items-center justify-center gap-1">
            <ReuseMonthTemplate :date="date" />
            {{
              formatter.custom(toDate(date), {
                year: 'numeric',
                calendar: date.calendar.identifier,
              })
            }}
          </div>
        </template>
        <template v-else-if="layout === 'year-only'">
          <div class="flex items-center justify-center gap-1">
            {{
              formatter.custom(toDate(date), {
                month: 'short',
                calendar: date.calendar.identifier,
              })
            }}
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else>
          <CalendarHeading />
        </template>
      </slot>

      <nav
        class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-1"
      >
        <CalendarPrevButton>
          <slot name="calendar-prev-icon" />
        </CalendarPrevButton>
        <CalendarNextButton>
          <slot name="calendar-next-icon" />
        </CalendarNextButton>
      </nav>
    </CalendarHeader>

    <div class="mt-4 flex flex-col gap-y-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell v-for="day in weekDays" :key="day">
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="mt-2 w-full"
          >
            <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
              <CalendarCellTrigger :day="weekDate" :month="month.value" />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
