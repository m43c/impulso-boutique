<script setup>
import { useMediaQuery } from '@vueuse/core'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ProductUnitsCardSkeleton from '@/components/products/units/skeletons/ProductUnitsCardSkeleton.vue'

const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4 lg:min-h-0 lg:flex-col lg:gap-4">
    <!-- Tabs-->
    <div class="mb-2 flex shrink-0 flex-col items-center justify-between gap-4">
      <div
        class="border-border/60 inline-flex w-full rounded-md border p-0.5 lg:w-auto lg:self-start"
      >
        <Skeleton class="h-8 flex-1 bg-muted rounded lg:w-24" />
        <Skeleton class="ml-1 h-8 flex-1 rounded lg:w-24" />
      </div>
    </div>
    <!-- Panel Content -->
    <Card class="flex min-h-[50vh] flex-col overflow-hidden py-0 lg:min-h-0 lg:flex-1">
      <CardContent class="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <!-- Toolbar -->
        <div class="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <!-- Search (Desktop/moblie) -->
          <Skeleton v-if="isDesktop" class="h-8 w-full rounded-md" />
          <Skeleton v-else class="h-9 w-9 shrink-0 rounded-md" />
          <!-- Update button -->
          <Skeleton class="h-8 w-8 shrink-0 rounded-md" />
          <!-- Filters (Desktop/mobile) -->
          <Skeleton class="lg:h-8 lg:w-20 h-9 w-9 shrink-0 rounded-md md:w-20" />
          <!-- Sorting (Mobile) -->
          <Skeleton v-if="!isDesktop" class="h-9 w-9 shrink-0 rounded-md" />
          <!-- Physical count button (Desktop/mobile) -->
          <Skeleton v-if="isDesktop" class="h-8 w-30 shrink-0 rounded-md" />
          <Skeleton v-else class="h-9 w-9 shrink-0 rounded-md" />
          <!-- Add product unit button (Desktop) -->
          <Skeleton v-if="isDesktop" class="h-8 w-37.5 shrink-0 rounded-md" />
        </div>
        <!-- Main content -->
        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <!-- Desktop view -->
          <template v-if="isDesktop">
            <Table class="border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead class=" border-b backdrop-blur">
                    <div class="flex justify-start"><Skeleton class="h-4 w-12" /></div>
                  </TableHead>
                  <TableHead class=" border-b backdrop-blur">
                    <div class="flex justify-center"><Skeleton class="h-4 w-12" /></div>
                  </TableHead>
                  <TableHead class=" border-b backdrop-blur">
                    <div class="flex justify-center"><Skeleton class="h-4 w-12" /></div>
                  </TableHead>
                  <TableHead class=" border-b backdrop-blur">
                    <div class="flex justify-start"><Skeleton class="h-4 w-12" /></div>
                  </TableHead>
                  <TableHead class=" w-12 border-b backdrop-blur"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="i in 10" :key="`skeleton-${i}`">
                  <!-- Unit -->
                  <TableCell class="border-b">
                    <div class="flex items-center gap-3">
                      <Skeleton class="h-10 w-10 shrink-0 rounded-sm" />
                      <Skeleton class="h-4 w-60" />
                    </div>
                  </TableCell>
                  <!-- Status -->
                  <TableCell class="border-b text-center">
                    <Skeleton class="mx-auto h-5 w-20 rounded-full" />
                  </TableCell>
                  <!-- Entry -->
                  <TableCell class="border-b text-center">
                    <Skeleton class="mx-auto h-4 w-16" />
                  </TableCell>
                  <!-- Origin -->
                  <TableCell class="border-b">
                    <Skeleton class="h-4 w-16" />
                  </TableCell>
                  <!-- Actions -->
                  <TableCell class="border-b text-center">
                    <Skeleton class="mx-auto h-6 w-6 rounded-full" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </template>
          <!-- Mobile view -->
          <div v-else class="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <ProductUnitsCardSkeleton v-for="i in 5" :key="`skeleton-card-${i}`" />
          </div>
        </div>
        <!-- Pagination -->
        <div class="flex shrink-0 items-center justify-between border-t px-3 py-2">
          <Skeleton class="h-4 w-20" />
          <div class="flex gap-2">
            <Skeleton class="h-8 w-24 rounded-md" />
            <Skeleton class="h-8 w-24 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
