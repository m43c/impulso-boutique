create or replace function public.register_sale (
  p_unit_ids uuid[],
  p_payment_method public.payment_type
) returns table (sale_id uuid, total_amount decimal(10, 2)) language plpgsql security definer
set
  search_path = public as $$
declare
  v_sale_id uuid;
  v_total   decimal(10, 2) := 0;
  v_count   int;
  v_unique  int;
  v_unit    record;
begin
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden registrar ventas'
      using errcode = '42501';
  end if;

  if p_unit_ids is null or array_length(p_unit_ids, 1) is null then
    raise exception 'Debe agregar al menos una unidad a la venta'
      using errcode = 'S6001';
  end if;

  if array_length(p_unit_ids, 1) > 50 then
    raise exception 'Una venta puede tener como máximo 50 unidades'
      using errcode = 'S6002';
  end if;

  if array_position(p_unit_ids, null) is not null then
    raise exception 'Una de las unidades indicadas no existe'
      using errcode = 'S6004';
  end if;

  select count(*), count(distinct u.id)
    into v_count, v_unique
    from unnest(p_unit_ids) as u(id);

  if v_count <> v_unique then
    raise exception 'No se puede vender la misma unidad dos veces en una venta'
      using errcode = '23505';
  end if;

  if p_payment_method is null then
    raise exception 'El método de pago es obligatorio'
      using errcode = 'S6003';
  end if;

  perform pu.id
    from public.product_units pu
   where pu.id = any(p_unit_ids)
   order by pu.id
     for update;

  for v_unit in
    select
      r.id as requested_id,
      pu.id as unit_id,
      pu.status,
      p.is_active,
      p.price
    from unnest(p_unit_ids) as r(id)
    left join public.product_units pu on pu.id = r.id
    left join public.products p on p.id = pu.product_id
    order by r.id
  loop
    if v_unit.unit_id is null then
      raise exception 'La unidad % no existe', v_unit.requested_id
        using errcode = 'S6004', detail = v_unit.requested_id::text;
    end if;

    if v_unit.status is distinct from 'available' then
      raise exception 'La unidad % no está disponible (estado actual: %)',
        v_unit.unit_id, v_unit.status
        using errcode = 'S6005', detail = v_unit.unit_id::text;
    end if;

    if v_unit.is_active is distinct from true then
      raise exception 'El producto de la unidad % fue retirado y no se puede vender',
        v_unit.unit_id
        using errcode = 'S6006', detail = v_unit.unit_id::text;
    end if;

    if v_unit.price is null or v_unit.price <= 0 then
      raise exception 'El producto de la unidad % no tiene un precio válido',
        v_unit.unit_id
        using errcode = 'S6007', detail = v_unit.unit_id::text;
    end if;

    v_total := v_total + v_unit.price;
  end loop;

  insert into public.sales (profile_id, total_amount, payment_method)
  values (auth.uid (), v_total, p_payment_method)
  returning id into v_sale_id;

  insert into public.sale_details (sale_id, product_unit_id, unit_price)
  select v_sale_id, pu.id, p.price
    from public.product_units pu
    join public.products p on p.id = pu.product_id
   where pu.id = any(p_unit_ids)
   order by pu.id;

  update public.product_units
     set status = 'sold'
   where id = any(p_unit_ids);

  insert into public.inventory_moves (
    product_unit_id, profile_id, sale_id, type, reason,
    previous_status, new_status
  )
  select
    pu.id, auth.uid (), v_sale_id, 'exit', 'sale',
    'available', 'sold'
    from public.product_units pu
   where pu.id = any(p_unit_ids);

  return query select v_sale_id, v_total;
end;
$$;

revoke all on function public.register_sale (uuid[], public.payment_type)
from
  public,
  anon;

grant
execute on function public.register_sale (uuid[], public.payment_type) to authenticated;
