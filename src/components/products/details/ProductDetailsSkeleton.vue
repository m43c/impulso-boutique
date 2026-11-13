<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card aria-hidden="true" class="w-full py-0">
    <CardContent class="w-full min-w-0 p-4">
      <!-- Desktop skeleton -->
      <div class="hidden flex-col gap-3 lg:flex">
        <div class="flex flex-col gap-1">
          <!-- Name -->
          <Skeleton class="h-4 w-3/4" />
          <!-- Description -->
          <div class="mt-1 flex flex-col gap-1.5">
            <Skeleton class="h-3 w-full" />
            <Skeleton class="h-3 w-5/6" />
          </div>
        </div>
        <div class="flex items-start gap-4">
          <!-- Image -->
          <Skeleton class="aspect-square w-44 shrink-0 rounded-sm" />
          <!-- Details -->
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <!-- Category -->
            <div class="flex gap-2">
              <Skeleton class="h-3 w-16" />
              <Skeleton class="h-3 w-20" />
            </div>
            <!-- Brand -->
            <div class="mt-0.5 flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-3 w-20" />
            </div>
            <!-- Color -->
            <div class="mt-0.5 flex items-center gap-2">
              <Skeleton class="h-3 w-10" />
              <Skeleton class="h-3 w-16" />
            </div>
            <!-- Size -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-8" />
              <Skeleton class="h-4 w-6 rounded-full" />
            </div>
            <!-- Price -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-4 w-16" />
            </div>
            <!-- Supplier -->
            <div class="mt-0.5 flex items-center gap-2">
              <Skeleton class="h-3 w-14" />
              <Skeleton class="h-3 w-20" />
            </div>
            <!-- Min stock -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-14" />
              <Skeleton class="h-4.5 w-4.5 rounded-full" />
            </div>
            <!-- Status -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-4 w-14 rounded-full" />
            </div>
          </div>
        </div>
        <!-- KPIs -->
        <div class="flex justify-evenly gap-2 border-y py-4">
          <div v-for="i in 3" :key="i" class="flex flex-col items-center">
            <Skeleton class="h-10 w-10 rounded-full" />
            <Skeleton class="mt-1.5 h-3 w-16" />
          </div>
        </div>
        <!-- Dates -->
        <div class="flex flex-col gap-1 text-xs">
          <div class="flex items-center gap-1">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-3 w-36" />
          </div>
          <div class="flex items-center gap-1">
            <Skeleton class="h-3 w-20" />
            <Skeleton class="h-3 w-36" />
          </div>
        </div>
      </div>
      <!-- Mobile skeleton -->
      <div class="flex w-full min-w-0 flex-col lg:hidden">
        <!-- Name -->
        <Skeleton class="mb-3 h-4 w-4/5" />
        <div class="mb-3 flex gap-3">
          <!-- Image -->
          <Skeleton class="aspect-square w-32 shrink-0 rounded-lg" />
          <!-- Details -->
          <div class="flex min-w-0 flex-1 flex-col gap-3 text-xs">
            <!-- Category -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-14" />
              <Skeleton class="h-3 w-16" />
            </div>
            <!-- Brand -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-3 w-14" />
            </div>
            <!-- Color -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-3 w-16" />
            </div>
            <!-- Size -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-10" />
              <Skeleton class="h-3.5 w-6" />
            </div>
            <!-- Status -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-4 w-14 rounded-full" />
            </div>
            <!-- Price -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <!-- Divisor -->
        <div class="mb-3 border-t"></div>
        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-1">
          <div v-for="i in 3" :key="i" class="flex flex-col items-center">
            <Skeleton class="h-8 w-8 rounded-full" />
            <Skeleton class="mt-1.5 h-3 w-16 max-w-full" />
          </div>
        </div>
        <!-- More details accordion -->
        <div class="mt-2 flex justify-center py-2">
          <Skeleton class="h-4 w-28" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
