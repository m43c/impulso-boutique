<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card aria-hidden="true" class="w-full py-0">
    <CardContent class="w-full min-w-0 p-4 md:p-4">
      <!-- Desktop skeleton -->
      <div class="hidden gap-5 md:flex md:flex-row">
        <!-- Image -->
        <Skeleton class="aspect-square w-48 shrink-0 rounded-lg" />
        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <!-- Name + status -->
          <div class="flex items-start justify-between gap-3">
            <Skeleton class="h-6 w-4/6" />
            <Skeleton class="h-5 w-16 shrink-0 rounded-full" />
          </div>
          <!-- Description -->
          <div class="flex flex-col gap-2">
            <Skeleton class="h-4 w-5/6" />
            <Skeleton class="h-4 w-5/6" />
          </div>
          <!-- Product attributes + KPIs -->
          <div class="grid grid-cols-2 gap-x-6 border-t pt-2 md:grid-cols-3">
            <!-- Category + color + price -->
            <div class="flex flex-col gap-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
            </div>
            <!-- Brand + size + minimum stock -->
            <div class="flex flex-col gap-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
            </div>
            <!-- KPIs -->
            <div class="col-span-2 flex flex-col gap-2 md:col-span-1">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
            </div>
          </div>
          <!-- Dates -->
          <div class="flex flex-col gap-2 border-t pt-2 sm:flex-row sm:justify-between">
            <Skeleton class="h-3 w-36" />
            <Skeleton class="h-3 w-36" />
          </div>
        </div>
      </div>
      <!-- Mobile skeleton -->
      <div class="flex min-w-0 flex-col md:hidden">
        <!-- Name -->
        <Skeleton class="mb-3 h-5 w-full" />
        <!-- Image and basic attributes -->
        <div class="mb-3 flex gap-4">
          <Skeleton class="h-28 w-28 shrink-0 rounded-lg" />
          <div class="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-4 w-16 rounded-full" />
          </div>
        </div>
        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-1 border-t pt-3">
          <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-2">
            <Skeleton class="h-8 w-8 rounded-full" />
            <Skeleton class="h-3 w-16 max-w-full" />
          </div>
        </div>
        <!-- More details accordion -->
        <div class="mt-3 flex justify-center border-t py-3">
          <Skeleton class="h-4 w-32" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
