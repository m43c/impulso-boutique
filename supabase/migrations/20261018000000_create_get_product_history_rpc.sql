create or replace function public.get_product_history (p_product_id uuid) returns table (
  id uuid,
  created_at timestamptz,
  product_unit_id uuid,
  type move_type,
  reason move_reason,
  note text,
  sale_id uuid,
  return_id uuid,
  profile_name text
) language sql stable security invoker
set
  search_path = public as $$
  select
    im.id,
    im.created_at,
    im.product_unit_id,
    im.type,
    im.reason,
    im.note,
    im.sale_id,
    im.return_id,
    p.full_name as profile_name
  from public.inventory_moves im
  join public.product_units pu on pu.id = im.product_unit_id
  join public.profiles p on p.id = im.profile_id
  where pu.product_id = p_product_id
  order by im.created_at desc;
$$;
