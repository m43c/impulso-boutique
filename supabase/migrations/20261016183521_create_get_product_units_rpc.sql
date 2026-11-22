create or replace function public.get_product_units (p_product_id uuid) returns table (
  id uuid,
  product_id uuid,
  status product_unit_status,
  created_at timestamptz,
  updated_at timestamptz,
  origin_reason move_reason
) language sql stable security invoker
set
  search_path = public as $$
  select
    pu.id,
    pu.product_id,
    pu.status,
    pu.created_at,
    pu.updated_at,
    fm.reason as origin_reason
  from public.product_units pu
  left join lateral (
    select im.reason
    from public.inventory_moves im
    where im.product_unit_id = pu.id
    order by im.created_at asc
    limit 1
  ) fm on true
  where pu.product_id = p_product_id
  order by pu.created_at desc;
$$;
