<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card class="py-0">
    <CardContent class="flex flex-col gap-2 p-4">
      <div class="flex items-center justify-between gap-2">
        <!-- Name -->
        <Skeleton class="h-5 w-56" />
        <!-- Actions menu -->
        <Skeleton class="h-8 w-8 shrink-0 rounded-full" />
      </div>
      <div class="flex items-stretch gap-3 pb-2">
        <!-- Image -->
        <Skeleton class="aspect-5/5 w-32 shrink-0 rounded-md" />
        <div class="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <!-- Category -->
          <div class="flex items-center justify-between gap-2">
            <Skeleton class="h-3 w-14" />
            <Skeleton class="h-3 w-16" />
          </div>
          <!-- Brand -->
          <div class="flex items-center justify-between gap-2">
            <Skeleton class="h-3 w-10" />
            <Skeleton class="h-3 w-16" />
          </div>
          <!-- Color -->
          <div class="flex items-center justify-between gap-2">
            <Skeleton class="h-3 w-10" />
            <Skeleton class="h-3 w-12" />
          </div>
          <!-- Size -->
          <div class="flex items-center justify-between gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-5 w-5 rounded-full" />
          </div>
          <!-- Status -->
          <div class="flex items-center justify-between gap-2">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-4 w-14" />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 border-t pt-3">
        <div class="flex justify-between">
          <!-- Price -->
          <Skeleton class="h-5 w-20" />
          <!-- Stock + min stock -->
          <div class="flex flex-col items-end gap-1">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="h-2.5 w-20" />
          </div>
        </div>
      </div>
      <!-- Date -->
      <Skeleton class="h-3 w-30" />
    </CardContent>
  </Card>
</template>
