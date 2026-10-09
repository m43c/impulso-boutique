import {
  columnFacetingFeature,
  columnFilteringFeature,
  constructFilterFn,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/vue-table'
import { normalizeText } from '@/utils/text'

const filterFn_includesStringNormalized = constructFilterFn({
  ...filterFn_includesString,
  resolveFilterValue: normalizeText,
  resolveDataValue: normalizeText,
})

export const features = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
  globalFilteringFeature,
  columnFilteringFeature,
  columnFacetingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  filterFns: { includesStringNormalized: filterFn_includesStringNormalized },
})
