create or replace function public.register_entry (
  p_product_id uuid,
  p_quantity integer,
  p_reason public.move_reason,
  p_note text default null
) returns setof uuid language plpgsql security definer
set
  search_path = public as $$
declare
  v_type public.move_type;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden registrar entradas de inventario';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  if not exists (
    select 1 from public.products
    where id = p_product_id and is_active = true
  ) then
    raise exception 'El producto no existe o está inactivo';
  end if;

  v_type := case p_reason
    when 'purchase' then 'entry'::public.move_type
    when 'count'    then 'adjustment'::public.move_type
    else null
  end;

  if v_type is null then
    raise exception 'Razón % no es válida para registrar entrada', p_reason;
  end if;

  return query
  with new_units as (
    insert into public.product_units (product_id)
    select p_product_id
    from generate_series(1, p_quantity)
    returning id
  ),
  new_moves as (
    insert into public.inventory_moves (
      product_unit_id, profile_id, type, reason,
      previous_status, new_status, note
    )
    select
      id,
      auth.uid(),
      v_type,
      p_reason,
      null,
      'available'::public.product_unit_status,
      p_note
    from new_units
    returning product_unit_id
  )
  select id from new_units;
end;
$$;

revoke
execute on function public.register_entry (uuid, integer, public.move_reason, text)
from
  public,
  anon;

grant
execute on function public.register_entry (uuid, integer, public.move_reason, text) to authenticated;
