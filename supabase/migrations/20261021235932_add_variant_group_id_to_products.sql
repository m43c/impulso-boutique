alter table public.products
  add column variant_group_id uuid;

create unique index products_variant_group_color_size_uq
  on public.products (
    variant_group_id,
    coalesce(lower(color), ''),
    coalesce(lower(size), '')
  )
  where variant_group_id is not null
    and is_active = true;
