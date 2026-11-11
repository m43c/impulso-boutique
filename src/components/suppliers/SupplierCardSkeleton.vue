<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-2 p-4 text-xs">
      <!-- Name + actions -->
      <div class="flex items-start justify-between gap-2">
        <Skeleton class="h-4.5 w-full" />
        <Skeleton class="h-6 w-6 shrink-0 rounded-full" />
      </div>
      <!-- Phone -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-14" />
        <Skeleton class="h-3.5 w-24" />
      </div>
      <!-- Country -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-8" />
        <Skeleton class="h-3.5 w-16" />
      </div>
      <!-- City -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-12" />
        <Skeleton class="h-3.5 w-24" />
      </div>
      <!-- Status -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-10 rounded-full" />
        <Skeleton class="h-5 w-16 rounded-full" />
      </div>
      <!-- Date -->
      <div class="flex min-w-0 items-center gap-2">
        <Skeleton class="h-3.5 w-16" />
        <Skeleton class="h-3.5 w-28" />
      </div>
    </CardContent>
  </Card>
</template>
