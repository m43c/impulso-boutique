<script setup>
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4 lg:min-h-0 lg:flex-col lg:gap-4">
    <!-- Tabs-->
    <div class="mb-2 flex shrink-0 flex-col items-center justify-between gap-4">
      <div
        class="border-border/60 inline-flex w-full rounded-md border p-0.5 lg:w-auto lg:self-start"
      >
        <Skeleton class="h-8 flex-1 rounded lg:w-24" />
        <Skeleton class="ml-1 h-8 flex-1 rounded lg:w-24" />
      </div>
    </div>
    <!-- Panel Content -->
    <Card class="flex min-h-[50vh] flex-col overflow-hidden py-0 lg:min-h-0 lg:flex-1">
      <CardContent class="flex min-h-0 flex-1 flex-col overflow-hidden p-0" />
    </Card>
  </div>
</template>
