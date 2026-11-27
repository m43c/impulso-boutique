create or replace function public.get_unit_sale (p_unit_id uuid) returns table (
  unit_id uuid,
  unit_status public.product_unit_status,
  sale_id uuid,
  sale_created_at timestamptz,
  payment_method public.payment_type,
  total_amount decimal(10, 2),
  profile_name text,
  returnable_until timestamptz,
  sale_detail_id uuid,
  unit_price decimal(10, 2),
  is_replacement_line boolean,
  can_return boolean,
  can_refund boolean,
  return_info jsonb,
  other_lines jsonb
) language plpgsql security definer
set
  search_path = public as $$
declare
  v_unit_status    public.product_unit_status;
  v_sale_detail_id uuid;
begin
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden consultar la venta de una unidad'
      using errcode = '42501';
  end if;

  select pu.status
    into v_unit_status
    from public.product_units pu
   where pu.id = p_unit_id;

  if not found then
    return;
  end if;

  if v_unit_status = 'sold' then
    select sd.id
      into v_sale_detail_id
      from public.sale_details sd
      join public.sales s on s.id = sd.sale_id
     where sd.product_unit_id = p_unit_id
     order by s.created_at desc, sd.id desc
     limit 1;
  elsif v_unit_status = 'returned' then
    select sd.id
      into v_sale_detail_id
      from public.sale_details sd
      join public.sales s on s.id = sd.sale_id
      join public.returns r on r.sale_detail_id = sd.id
     where sd.product_unit_id = p_unit_id
     order by s.created_at desc, r.created_at desc, sd.id desc
     limit 1;
  else
    return;
  end if;

  if v_sale_detail_id is null then
    return;
  end if;

  return query
  with target as (
    select
      sd.id as sale_detail_id,
      sd.sale_id,
      sd.product_unit_id,
      sd.unit_price,
      s.created_at as sale_created_at,
      s.payment_method,
      s.total_amount,
      s.profile_id
    from public.sale_details sd
    join public.sales s on s.id = sd.sale_id
    where sd.id = v_sale_detail_id
  ),
  flags as (
    select
      t.*,
      exists (
        select 1
          from public.returns r
         where r.sale_detail_id = t.sale_detail_id
      ) as has_return,
      exists (
        select 1
          from public.returns r
         where r.replacement_sale_detail_id = t.sale_detail_id
      ) as is_replacement_line
    from target t
  )
  select
    pu.id,
    pu.status,
    f.sale_id,
    f.sale_created_at,
    f.payment_method,
    f.total_amount,
    coalesce(pr.full_name, '—') as profile_name,
    f.sale_created_at + interval '24 hours' as returnable_until,
    f.sale_detail_id,
    f.unit_price,
    f.is_replacement_line,
    (
      not f.has_return
      and pu.status = 'sold'
      and clock_timestamp() <= f.sale_created_at + interval '24 hours'
    ) as can_return,
    (
      not f.has_return
      and pu.status = 'sold'
      and clock_timestamp() <= f.sale_created_at + interval '24 hours'
      and not f.is_replacement_line
      and f.payment_method is not null
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
        'replacement_product_name', rproduct.name
      )
      from public.returns r
      left join public.profiles rp on rp.id = r.profile_id
      left join public.sale_details rsd on rsd.id = r.replacement_sale_detail_id
      left join public.product_units ru on ru.id = rsd.product_unit_id
      left join public.products rproduct on rproduct.id = ru.product_id
      where r.sale_detail_id = f.sale_detail_id
    ) as return_info,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'sale_detail_id', sd2.id,
            'unit_id', pu2.id,
            'unit_code', left(pu2.id::text, 8),
            'product_name', p2.name,
            'color', p2.color,
            'size', p2.size,
            'image_public_id', p2.image_public_id,
            'unit_price', sd2.unit_price,
            'status', case when r2.id is not null then 'returned' else 'sold' end,
            'return_type', r2.type
          )
          order by p2.name, pu2.id
        )
        from public.sale_details sd2
        join public.product_units pu2 on pu2.id = sd2.product_unit_id
        join public.products p2 on p2.id = pu2.product_id
        left join public.returns r2 on r2.sale_detail_id = sd2.id
        where sd2.sale_id = f.sale_id
          and sd2.id <> f.sale_detail_id
      ),
      '[]'::jsonb
    ) as other_lines
  from flags f
  join public.product_units pu on pu.id = f.product_unit_id
  left join public.profiles pr on pr.id = f.profile_id;
end;
$$;

revoke all on function public.get_unit_sale (uuid)
from
  public,
  anon;

grant
execute on function public.get_unit_sale (uuid) to authenticated;
