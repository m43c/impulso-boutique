create or replace function public.get_inventory_moves () returns table (
  id uuid,
  created_at timestamptz,
  product_unit_id uuid,
  product_id uuid,
  product_name text,
  product_is_active boolean,
  type move_type,
  reason move_reason,
  previous_status product_unit_status,
  new_status product_unit_status,
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
    u.product_id,
    p.name as product_name,
    p.is_active as product_is_active,
    im.type,
    im.reason,
    im.previous_status,
    im.new_status,
    im.note,
    im.sale_id,
    im.return_id,
    pr.full_name as profile_name
  from public.inventory_moves im
  join public.product_units u on u.id = im.product_unit_id
  join public.products p on p.id = u.product_id
  left join public.profiles pr on pr.id = im.profile_id
  order by im.created_at desc
  limit 500;
$$;
