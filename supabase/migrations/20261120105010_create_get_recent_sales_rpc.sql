create or replace function public.get_recent_sales (p_search text default null) returns table (
  id uuid,
  created_at timestamptz,
  profile_name text,
  payment_method public.payment_type,
  total_amount decimal(10, 2),
  items_count integer,
  lines public.recent_sale_item[]
) language plpgsql stable security definer
set
  search_path = public as $$
declare
  v_search text;
begin
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden consultar ventas'
      using errcode = '42501';
  end if;

  v_search := lower(extensions.unaccent (btrim (coalesce(p_search, ''))));

  return query
  select
    s.id,
    s.created_at,
    coalesce(pr.full_name, '—') as profile_name,
    s.payment_method,
    s.total_amount,
    count(sd.id)::integer as items_count,
    coalesce (
      array_agg (
        row (
          sd.product_unit_id,
          p.name,
          p.color,
          p.size,
          p.image_public_id,
          sd.unit_price
        )::public.recent_sale_item
        order by p.name, sd.product_unit_id
      ) filter (where sd.id is not null),
      array[]::public.recent_sale_item[]
    ) as lines
  from public.sales s
  left join public.profiles pr on pr.id = s.profile_id
  left join public.sale_details sd on sd.sale_id = s.id
  left join public.product_units pu on pu.id = sd.product_unit_id
  left join public.products p on p.id = pu.product_id
  where s.created_at >= now () - interval '24 hours'
    and (
      v_search = ''
      or exists (
        select 1
        from public.sale_details sd2
        join public.product_units pu2 on pu2.id = sd2.product_unit_id
        join public.products p2 on p2.id = pu2.product_id
        where sd2.sale_id = s.id
          and (
            position(v_search in lower(extensions.unaccent (p2.name))) > 0
            or position(v_search in lower(extensions.unaccent (coalesce(p2.color, '')))) > 0
            or position(v_search in lower(extensions.unaccent (coalesce(p2.size, '')))) > 0
          )
      )
    )
  group by
    s.id,
    s.created_at,
    pr.full_name,
    s.payment_method,
    s.total_amount
  order by s.created_at desc
  limit 200;
end;
$$;

revoke all on function public.get_recent_sales (text)
from
  public,
  anon;

grant
execute on function public.get_recent_sales (text) to authenticated;
