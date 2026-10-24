<script setup>
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <!-- Banner de estado -->
  <Card class="py-0">
    <CardContent class="flex items-center gap-3 p-4">
      <Skeleton class="h-5 w-32 shrink-0 rounded-full" />
      <div class="flex flex-1 flex-col gap-1">
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-3 w-28" />
      </div>
    </CardContent>
  </Card>

  <!-- Tarjeta de producto -->
  <Card class="py-0">
    <CardContent class="flex items-center gap-3 p-4">
      <Skeleton class="h-24 w-24 shrink-0 rounded-lg" />
      <div class="flex flex-1 flex-col gap-2">
        <Skeleton class="h-5 w-48" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-24" />
      </div>
    </CardContent>
  </Card>

  <!-- Datos de la unidad -->
  <Card class="py-0">
    <CardContent class="flex flex-col gap-2 p-4">
      <div class="flex items-center gap-3">
        <Skeleton class="h-5 w-32" />
        <Skeleton class="h-5 w-8 shrink-0 rounded-full" />
      </div>
      <Skeleton class="h-4 w-24" />
    </CardContent>
  </Card>

  <!-- Botón -->
  <Card class="py-0">
    <CardContent class="p-4">
      <Skeleton class="h-10 w-40 rounded-md" />
    </CardContent>
  </Card>
</template>