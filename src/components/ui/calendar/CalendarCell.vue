<script setup>
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { CalendarCell, useForwardProps } from 'reka-ui'

const props = defineProps({
  date: { type: Object, required: true },
  asChild: { type: Boolean, required: false },
  as: { type: [String, Object, Function], required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarCell
    data-slot="calendar-cell"
    :class="
      cn(
        '[&:has([data-selected])]:bg-accent relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:rounded-md',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarCell>
</template>
