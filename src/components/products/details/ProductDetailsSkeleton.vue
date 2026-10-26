<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card aria-hidden="true" class="w-full py-0">
    <CardContent class="w-full min-w-0 p-4">
      <!-- Desktop skeleton -->
      <div class="hidden flex-col gap-4 lg:flex">
        <div class="flex flex-col gap-2">
          <!-- Name -->
          <Skeleton class="h-4 w-full" />
          <!-- Description -->
          <div class="mt-1 flex flex-col gap-1.5">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
            <Skeleton class="h-4 w-4/6" />
          </div>
        </div>
        <div class="flex items-start gap-5">
          <!-- Image -->
          <Skeleton class="aspect-5/5 w-32 shrink-0 rounded-lg lg:w-52 lg:rounded-sm" />
          <!-- Details -->
          <div class="flex min-w-0 flex-1 flex-col gap-4 text-sm">
            <!-- Category -->
            <div class="flex justify-between gap-2">
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-4 w-14" />
            </div>
            <!-- Brand -->
            <div class="flex justify-between gap-2">
              <Skeleton class="h-4 w-12" />
              <Skeleton class="h-4 w-20" />
            </div>
            <!-- Color -->
            <div class="flex justify-between gap-2">
              <Skeleton class="h-4 w-12" />
              <Skeleton class="h-4 w-10" />
            </div>
            <!-- Size -->
            <div class="flex justify-between gap-2">
              <Skeleton class="h-4 w-10" />
              <Skeleton class="h-4 w-6" />
            </div>
            <!-- Price -->
            <div class="flex justify-between gap-2">
              <Skeleton class="h-4 w-12" />
              <Skeleton class="h-4 w-16" />
            </div>
            <!-- Min stock -->
            <div class="flex justify-between gap-2">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-4" />
            </div>
            <!-- Status -->
            <div class="flex items-center justify-between gap-2">
              <Skeleton class="h-3 w-14" />
              <Skeleton class="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <!-- KPIs -->
        <div class="flex justify-evenly gap-2 border-y py-4">
          <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-1">
            <Skeleton class="h-10 w-10 rounded-full" />
            <Skeleton class="h-3 w-16 max-w-full" />
          </div>
        </div>
        <!-- Dates -->
        <div class="flex justify-between gap-2 pt-1">
          <Skeleton class="h-3 w-40" />
          <Skeleton class="h-3 w-40" />
        </div>
      </div>
      <!-- Mobile skeleton -->
      <div class="flex min-w-0 flex-col lg:hidden">
        <!-- Name -->
        <Skeleton class="mb-3 h-5 w-full" />
        <!-- Image and basic attributes -->
        <div class="mb-3 flex gap-4">
          <Skeleton class="aspect-5/5 w-32 shrink-0 rounded-lg" />
          <div class="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
            <div class="flex justify-between gap-2">
              <Skeleton class="h-3 w-16" />
              <Skeleton class="h-3 w-14" />
            </div>
            <div class="flex justify-between gap-2 pt-1">
              <Skeleton class="h-3 w-16" />
              <Skeleton class="h-3 w-14" />
            </div>
            <div class="flex justify-between gap-2 pt-1">
              <Skeleton class="h-3 w-14" />
              <Skeleton class="h-3 w-12" />
            </div>
            <div class="flex justify-between gap-2 pt-1">
              <Skeleton class="h-3 w-12" />
              <Skeleton class="h-4 w-5 rounded-full" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <Skeleton class="h-3 w-14" />
              <Skeleton class="h-3.5 w-12 rounded-full" />
            </div>
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
