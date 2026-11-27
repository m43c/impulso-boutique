<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card aria-hidden="true" class="w-full py-0">
    <CardContent class="w-full min-w-0 p-4">
      <!-- Desktop skeleton -->
      <div class="hidden flex-col gap-3 lg:flex">
        <!-- Name -->
        <div class="flex flex-col gap-1">
          <Skeleton class="h-4 w-full" />
        </div>
        <!-- Image + Details -->
        <div class="flex items-start gap-4">
          <!-- Image -->
          <Skeleton class="aspect-square w-44 shrink-0 rounded-sm" />
          <!-- Details -->
          <div class="-mt-0,5 flex min-w-0 flex-1 flex-col gap-2.5">
            <!-- Category -->
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-3 w-16" />
              <Skeleton class="h-3 w-24" />
            </div>
            <!-- Brand -->
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-3 w-20" />
            </div>
            <!-- Color -->
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-3 w-10" />
              <Skeleton class="h-3 w-16" />
            </div>
            <!-- Size -->
            <div class="flex gap-2">
              <Skeleton class="h-3 w-8" />
              <Skeleton class="h-3.5 w-6" />
            </div>
            <!-- Status -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-4 w-14 rounded-full" />
            </div>
          </div>
        </div>
        <!-- Price + min stock -->
        <div class="mt-1 flex justify-between gap-4 border-t pt-2">
          <!-- Price -->
          <div class="flex gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-3.5 w-20" />
          </div>
          <!-- Min stock -->
          <div class="flex items-center gap-1">
            <Skeleton class="h-3.5 w-3.5 rounded-full" />
            <div class="flex gap-2">
              <Skeleton class="h-3.5 w-14" />
              <Skeleton class="h-3.5 w-5 rounded-full" />
            </div>
          </div>
        </div>
        <!-- KPIs -->
        <div class="flex justify-evenly gap-2 pt-2">
          <div v-for="i in 3" :key="i" class="flex flex-col items-center">
            <Skeleton class="h-10 w-10 rounded-full" />
            <Skeleton class="mt-1.5 h-3 w-16" />
          </div>
        </div>
        <!-- More details -->
        <div class="-mt-1 flex flex-col gap-1 pt-2">
          <!-- Description -->
          <div class="flex flex-col gap-1.5">
            <Skeleton class="h-3 w-20" />
            <Skeleton class="h-3 w-full" />
            <Skeleton class="h-3 w-4/5" />
          </div>
          <!-- Supplier -->
          <div class="mt-1 flex flex-col gap-1 pb-1">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-3 w-32" />
          </div>
          <!-- Dates -->
          <div class="mt-2 flex flex-col gap-1 border-t pt-4">
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
      </div>
      <!-- Mobile skeleton -->
      <div class="flex w-full min-w-0 flex-col lg:hidden">
        <!-- Name -->
        <Skeleton class="mb-3 h-4 w-full" />

        <!-- Image -->
        <div class="mb-3 flex justify-center">
          <Skeleton class="aspect-square w-40 shrink-0 rounded-lg" />
        </div>
        <!-- Details -->
        <div class="flex flex-col gap-2">
          <!-- Category -->
          <div class="flex items-center gap-2">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-3 w-24" />
          </div>
          <!-- Brand -->
          <div class="flex items-center gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-3 w-20" />
          </div>
          <!-- Color -->
          <div class="flex items-center gap-2">
            <Skeleton class="h-3 w-10" />
            <Skeleton class="h-3 w-16" />
          </div>
          <!-- Size -->
          <div class="flex items-center gap-2">
            <Skeleton class="h-3 w-8" />
            <Skeleton class="h-3 w-6" />
          </div>
          <!-- Status -->
          <div class="flex items-center gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-4 w-14 rounded-full" />
          </div>
        </div>
        <!-- Price + min stock -->
        <div class="mt-3 flex items-center justify-between gap-4 border-t pt-3">
          <!-- Price -->
          <div class="flex gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-3.5 w-16" />
          </div>
          <!-- Min stock -->
          <div class="flex items-center gap-1">
            <Skeleton class="h-3.5 w-3.5 rounded-full" />
            <div class="flex gap-2">
              <Skeleton class="h-3.5 w-14" />
              <Skeleton class="h-3.5 w-5 rounded-full" />
            </div>
          </div>
        </div>
        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-1 pt-4">
          <div v-for="i in 4" :key="i" class="flex flex-col items-center">
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
