<script setup>
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-12">
    <!-- Left column -->
    <div class="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:h-full lg:min-h-0">
      <!-- Status banner -->
      <Skeleton class="h-9 w-full shrink-0 rounded-lg lg:rounded-sm" />
      <!-- Product card -->
      <Card
        class="overflow-hidden p-0 shadow-sm lg:overflow-y-auto lg:rounded-md lg:border lg:bg-transparent lg:shadow-none"
      >
        <CardContent class="flex flex-col gap-4 p-4 lg:px-6 lg:pb-6">
          <!-- Name & description -->
          <div class="flex w-full flex-col gap-2">
            <Skeleton class="h-5 w-full" />
            <Skeleton class="h-3 w-full" />
            <Skeleton class="h-3 w-5/6" />
            <Skeleton class="h-3 w-2/3" />
          </div>
          <!-- Image and details -->
          <div class="flex w-full flex-wrap items-stretch gap-4 lg:gap-5">
            <!-- Image -->
            <Skeleton
              class="mx-auto aspect-square w-32 shrink-0 rounded-lg lg:w-44 lg:rounded-sm"
            />
            <!-- Details -->
            <div class="flex min-w-0 flex-1 flex-col justify-between">
              <div class="flex flex-col gap-3">
                <!-- Category -->
                <div class="flex items-center gap-2">
                  <Skeleton class="h-3 w-16 shrink-0" />
                  <Skeleton class="h-3 w-full max-w-25" />
                </div>
                <!-- Brand -->
                <div class="flex items-center gap-2">
                  <Skeleton class="h-3 w-12 shrink-0" />
                  <Skeleton class="h-3 w-full max-w-20" />
                </div>
                <!-- Color -->
                <div class="flex items-center gap-2">
                  <Skeleton class="h-3 w-12 shrink-0" />
                  <Skeleton class="h-3 w-full max-w-17.5" />
                </div>
                <!-- Size -->
                <div class="flex items-center gap-2">
                  <Skeleton class="h-3 w-10 shrink-0" />
                  <Skeleton class="h-3 w-full max-w-12.5" />
                </div>
                <!-- Price -->
                <div class="flex items-center gap-2">
                  <Skeleton class="h-3 w-14 shrink-0" />
                  <Skeleton class="h-3 w-full max-w-20" />
                </div>
              </div>
            </div>
          </div>
          <!-- Unit info -->
          <div class="flex flex-col gap-2 border-t pt-3">
            <!-- ID + Origin -->
            <div class="flex justify-between gap-2">
              <div class="flex items-center gap-2">
                <Skeleton class="h-3 w-14" />
                <Skeleton class="h-3 w-20" />
              </div>
              <div class="flex items-center gap-2">
                <Skeleton class="h-3 w-12" />
                <Skeleton class="h-3 w-16" />
              </div>
            </div>
            <!-- Dates -->
            <div class="flex justify-between gap-2">
              <div class="flex items-center gap-2">
                <Skeleton class="h-3 w-14" />
                <Skeleton class="h-3 w-16" />
              </div>
              <div class="flex items-center gap-2">
                <Skeleton class="h-3 w-20" />
                <Skeleton class="h-3 w-16" />
              </div>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="mt-2 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Skeleton class="h-9 w-full rounded-md sm:w-36" />
            <Skeleton class="h-9 w-full rounded-md sm:w-44" />
          </div>
        </CardContent>
      </Card>
    </div>
    <!-- Right column -->
    <div
      class="flex min-w-0 flex-col gap-2.5 lg:col-span-7 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <Card
        class="gap-0 overflow-hidden border p-0 shadow-sm lg:rounded-md lg:border lg:bg-transparent lg:shadow-none"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b px-4 py-2">
          <Skeleton class="h-5 w-52" />
          <Skeleton class="h-8 w-8 rounded-md" />
        </div>
        <!-- Variants table -->
        <div class="relative w-full overflow-x-auto">
          <div class="min-w-150">
            <!-- Table header -->
            <div class="bg-muted flex items-center gap-4 border-b px-4 py-3">
              <Skeleton class="h-3 w-16 shrink-0" />
              <Skeleton v-for="i in 5" :key="i" class="h-3 flex-1" />
            </div>
            <!-- Table rows -->
            <div
              v-for="row in 4"
              :key="row"
              class="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton class="h-3 w-16 shrink-0" />
              <Skeleton v-for="i in 5" :key="i" class="h-4 flex-1" />
            </div>
          </div>
        </div>
        <!-- Legend -->
        <div class="bg-muted/20 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t px-3 py-2">
          <div class="flex gap-4">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-3 w-20" />
          </div>
          <Skeleton class="h-3 w-48" />
        </div>
      </Card>
    </div>
  </div>
</template>
