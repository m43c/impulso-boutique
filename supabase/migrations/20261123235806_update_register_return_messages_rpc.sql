create or replace function public.register_return (
  p_sale_detail_id uuid,
  p_type public.return_type,
  p_reason public.return_reason,
  p_note text default null,
  p_replacement_unit_id uuid default null
) returns table (
  return_id uuid,
  refund_amount decimal(10, 2),
  refund_method public.payment_type
) language plpgsql security definer
set
  search_path = public as $$
declare
  v_sale_id            uuid;
  v_sale_created_at    timestamptz;
  v_payment_method     public.payment_type;
  v_returned_unit_id   uuid;
  v_unit_price         decimal(10, 2);
  v_note               text := nullif(btrim(coalesce(p_note, '')), '');
  v_new_return_id      uuid;
  v_new_sale_id        uuid;
  v_new_sale_detail_id uuid;
  v_replacement_status public.product_unit_status;
  v_replacement_active boolean;
  v_replacement_price  decimal(10, 2);
begin
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden registrar devoluciones'
      using errcode = '42501';
  end if;

  if p_type is null or p_reason is null then
    raise exception 'Debe indicar el tipo y el motivo de la devolución'
      using errcode = 'S7010';
  end if;

  if p_type = 'refund' and p_replacement_unit_id is not null then
    raise exception 'Un reembolso no lleva unidad de reemplazo'
      using errcode = 'S7011';
  end if;

  if p_type = 'exchange' and p_replacement_unit_id is null then
    raise exception 'Un cambio requiere una unidad de reemplazo'
      using errcode = 'S7011';
  end if;

  select
    sd.sale_id,
    s.created_at,
    s.payment_method,
    sd.product_unit_id,
    sd.unit_price
    into
      v_sale_id,
      v_sale_created_at,
      v_payment_method,
      v_returned_unit_id,
      v_unit_price
    from public.sale_details sd
    join public.sales s on s.id = sd.sale_id
   where sd.id = p_sale_detail_id;

  if not found then
    raise exception 'La unidad de venta indicada no existe'
      using errcode = 'S7009';
  end if;

  if p_type = 'exchange' and p_replacement_unit_id = v_returned_unit_id then
    raise exception 'La unidad de reemplazo es la misma que se devuelve'
      using errcode = 'S7007', detail = v_returned_unit_id::text;
  end if;

  perform pu.id
    from public.product_units pu
   where pu.id = v_returned_unit_id
      or pu.id = p_replacement_unit_id
   order by pu.id
     for update;

  if exists (
    select 1
      from public.returns r
     where r.sale_detail_id = p_sale_detail_id
  ) then
    raise exception 'Esta unidad ya fue devuelta'
      using errcode = 'S7002';
  end if;

  if (
    select pu.status
      from public.product_units pu
     where pu.id = v_returned_unit_id
  ) is distinct from 'sold' then
    raise exception 'La unidad no está vendida'
      using errcode = 'S7003', detail = v_returned_unit_id::text;
  end if;

  if clock_timestamp() > v_sale_created_at + interval '24 hours' then
    raise exception 'El plazo de 24 horas para devolver venció'
      using errcode = 'S7001';
  end if;

  if p_type = 'refund' then
    if exists (
      select 1
        from public.returns r
       where r.replacement_sale_detail_id = p_sale_detail_id
    ) then
      raise exception 'Una unidad recibida en un cambio solo puede cambiarse otra vez'
        using errcode = 'S7004';
    end if;

    if v_payment_method is null then
      raise exception 'La venta original no tiene método de pago'
        using errcode = 'S7004';
    end if;

    insert into public.returns (sale_detail_id, profile_id, type, reason, note)
    values (p_sale_detail_id, auth.uid (), 'refund', p_reason, v_note)
    returning id into v_new_return_id;

    update public.product_units
       set status = 'returned'
     where id = v_returned_unit_id;

    insert into public.inventory_moves (
      product_unit_id, profile_id, return_id, type, reason,
      previous_status, new_status, note
    )
    values (
      v_returned_unit_id, auth.uid (), v_new_return_id, 'entry', 'return',
      'sold', 'returned', v_note
    );

    return query select v_new_return_id, v_unit_price, v_payment_method;

    return;
  end if;

  select pu.status, p.is_active, p.price
    into v_replacement_status, v_replacement_active, v_replacement_price
    from public.product_units pu
    join public.products p on p.id = pu.product_id
   where pu.id = p_replacement_unit_id;

  if not found then
    raise exception 'La unidad de reemplazo no existe'
      using errcode = 'S6004', detail = p_replacement_unit_id::text;
  end if;

  if v_replacement_status is distinct from 'available' then
    raise exception 'La unidad de reemplazo no está disponible'
      using errcode = 'S7005', detail = p_replacement_unit_id::text;
  end if;

  if v_replacement_active is distinct from true then
    raise exception 'El producto de la unidad de reemplazo fue retirado'
      using errcode = 'S6006', detail = p_replacement_unit_id::text;
  end if;

  if v_replacement_price is distinct from v_unit_price then
    raise exception 'El precio de la unidad de reemplazo no coincide con el precio pagado'
      using errcode = 'S7006', detail = p_replacement_unit_id::text;
  end if;

  insert into public.sales (profile_id, total_amount, payment_method)
  values (auth.uid (), 0, null)
  returning id into v_new_sale_id;

  insert into public.sale_details (sale_id, product_unit_id, unit_price)
  values (v_new_sale_id, p_replacement_unit_id, v_replacement_price)
  returning id into v_new_sale_detail_id;

  insert into public.returns (
    sale_detail_id, profile_id, replacement_sale_detail_id, type, reason, note
  )
  values (
    p_sale_detail_id, auth.uid (), v_new_sale_detail_id, 'exchange', p_reason, v_note
  )
  returning id into v_new_return_id;

  update public.product_units
     set status = 'returned'
   where id = v_returned_unit_id;

  update public.product_units
     set status = 'sold'
   where id = p_replacement_unit_id;

  insert into public.inventory_moves (
    product_unit_id, profile_id, return_id, type, reason,
    previous_status, new_status, note
  )
  values (
    v_returned_unit_id, auth.uid (), v_new_return_id, 'entry', 'exchange',
    'sold', 'returned', v_note
  );

  insert into public.inventory_moves (
    product_unit_id, profile_id, sale_id, return_id, type, reason,
    previous_status, new_status, note
  )
  values (
    p_replacement_unit_id, auth.uid (), v_new_sale_id, v_new_return_id, 'exit', 'exchange',
    'available', 'sold', v_note
  );

  return query select v_new_return_id, null::decimal(10, 2), null::public.payment_type;
end;
$$;

revoke all on function public.register_return (
  uuid,
  public.return_type,
  public.return_reason,
  text,
  uuid
)
from
  public,
  anon;

grant
execute on function public.register_return (
  uuid,
  public.return_type,
  public.return_reason,
  text,
  uuid
) to authenticated;
