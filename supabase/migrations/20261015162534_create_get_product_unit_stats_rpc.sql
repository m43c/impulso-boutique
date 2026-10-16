create or replace function public.get_product_unit_stats (p_product_id uuid) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'available',   count(*) filter (where status = 'available'),
    'sold',        count(*) filter (where status = 'sold'),
    'returned',    count(*) filter (where status = 'returned'),
    'unavailable', count(*) filter (where status = 'unavailable'),
    'total',       count(*)
  )
  from public.product_units
  where product_id = p_product_id;
$$;
