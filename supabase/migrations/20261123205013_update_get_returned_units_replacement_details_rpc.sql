drop function if exists public.get_returned_units ();

create or replace function public.get_returned_units () returns table (
  unit_id uuid,
  unit_code text,
  product_name text,
  color text,
  size text,
  image_public_id text,
  product_is_active boolean,
  return_id uuid,
  return_type public.return_type,
  return_reason public.return_reason,
  return_note text,
  return_created_at timestamptz,
  return_profile_name text,
  unit_price decimal(10, 2),
  sale_id uuid,
  replacement_unit_id uuid,
  replacement_unit_code text,
  replacement_product_name text,
  replacement_color text,
  replacement_size text
) language plpgsql stable security definer
set
  search_path = public as $$
begin
  if not public.is_admin () then
    raise exception 'Solo administradores pueden revisar devoluciones'
      using errcode = '42501';
  end if;

  return query
  select
    pu.id,
    left(pu.id::text, 8),
    p.name,
    p.color,
    p.size,
    p.image_public_id,
    p.is_active,
    lr.id,
    lr.type,
    lr.reason,
    lr.note,
    lr.created_at,
    coalesce(pr.full_name, '—'),
    lr.unit_price,
    lr.sale_id,
    ru.id,
    left(ru.id::text, 8),
    rproduct.name,
    rproduct.color,
    rproduct.size
  from public.product_units pu
  join public.products p on p.id = pu.product_id
  join lateral (
    select
      r.id,
      r.type,
      r.reason,
      r.note,
      r.created_at,
      r.profile_id,
      r.replacement_sale_detail_id,
      sd.unit_price,
      sd.sale_id
    from public.returns r
    join public.sale_details sd on sd.id = r.sale_detail_id
    where sd.product_unit_id = pu.id
    order by r.created_at desc, r.id desc
    limit 1
  ) lr on true
  left join public.profiles pr on pr.id = lr.profile_id
  left join public.sale_details rsd on rsd.id = lr.replacement_sale_detail_id
  left join public.product_units ru on ru.id = rsd.product_unit_id
  left join public.products rproduct on rproduct.id = ru.product_id
  where pu.status = 'returned'
  order by lr.created_at asc, pu.id
  limit 200;
end;
$$;

revoke all on function public.get_returned_units ()
from
  public,
  anon;

grant
execute on function public.get_returned_units () to authenticated;
