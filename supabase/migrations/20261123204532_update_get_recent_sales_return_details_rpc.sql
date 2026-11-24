create or replace function public.get_recent_sales (p_search text default null) returns table (
  id uuid,
  created_at timestamptz,
  profile_name text,
  payment_method public.payment_type,
  total_amount decimal(10, 2),
  items_count integer,
  returnable_until timestamptz,
  lines public.recent_sale_item[]
) language plpgsql security definer
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
    s.created_at + interval '24 hours' as returnable_until,
    coalesce(
      array_agg(
        row(
          sd.product_unit_id,
          p.name,
          p.color,
          p.size,
          p.image_public_id,
          sd.unit_price,
          sd.id,
          lf.is_replacement_line,
          lf.can_return,
          lf.can_refund,
          lf.return_info,
          lf.replaced_info
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
  left join lateral (
    select
      exists (
        select 1
          from public.returns r
         where r.replacement_sale_detail_id = sd.id
      ) as is_replacement_line,
      (
        not exists (
          select 1
            from public.returns r
           where r.sale_detail_id = sd.id
        )
        and pu.status = 'sold'
        and clock_timestamp() <= s.created_at + interval '24 hours'
      ) as can_return,
      (
        not exists (
          select 1
            from public.returns r
           where r.sale_detail_id = sd.id
        )
        and pu.status = 'sold'
        and clock_timestamp() <= s.created_at + interval '24 hours'
        and not exists (
          select 1
            from public.returns r
           where r.replacement_sale_detail_id = sd.id
        )
        and s.payment_method is not null
      ) as can_refund,
      (
        select jsonb_build_object(
          'id', r.id,
          'type', r.type,
          'reason', r.reason,
          'note', r.note,
          'created_at', r.created_at,
          'profile_name', coalesce(rp.full_name, '—'),
          'replacement_unit_id', ru.id,
          'replacement_unit_code', left(ru.id::text, 8),
          'replacement_product_name', rproduct.name,
          'replacement_color', rproduct.color,
          'replacement_size', rproduct.size
        )
        from public.returns r
        left join public.profiles rp on rp.id = r.profile_id
        left join public.sale_details rsd on rsd.id = r.replacement_sale_detail_id
        left join public.product_units ru on ru.id = rsd.product_unit_id
        left join public.products rproduct on rproduct.id = ru.product_id
        where r.sale_detail_id = sd.id
      ) as return_info,
      (
        select jsonb_build_object(
          'unit_id', ru.id,
          'unit_code', left(ru.id::text, 8),
          'product_name', rproduct.name,
          'color', rproduct.color,
          'size', rproduct.size
        )
        from public.returns r
        join public.sale_details rsd on rsd.id = r.sale_detail_id
        join public.product_units ru on ru.id = rsd.product_unit_id
        join public.products rproduct on rproduct.id = ru.product_id
        where r.replacement_sale_detail_id = sd.id
      ) as replaced_info
    where sd.id is not null
  ) lf on true
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
