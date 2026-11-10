create or replace function public.register_count_missing (p_unit_ids uuid[], p_note text default null) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_count      int;
  v_found      int;
  v_not_avail  int;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden registrar conteos físicos';
  end if;

  if p_unit_ids is null then
    raise exception 'Debe indicar las unidades faltantes';
  end if;

  v_count := array_length(p_unit_ids, 1);

  if v_count is null or v_count < 1 then
    raise exception 'Debe indicar al menos una unidad faltante';
  end if;

  perform id
    from public.product_units
   where id = any(p_unit_ids)
     for update;

  select count(*) into v_found
    from public.product_units
   where id = any(p_unit_ids);

  if v_found <> v_count then
    raise exception 'Una o más unidades no existen';
  end if;

  select count(*) into v_not_avail
    from public.product_units
   where id = any(p_unit_ids)
     and status <> 'available';

  if v_not_avail > 0 then
    raise exception 'Al menos una unidad ya no está disponible (fue modificada por otro usuario)';
  end if;

  update public.product_units
     set status = 'unavailable'
   where id = any(p_unit_ids);

  insert into public.inventory_moves (
    product_unit_id, profile_id, type, reason,
    previous_status, new_status, note
  )
  select
    unnest(p_unit_ids), auth.uid(), 'adjustment', 'count',
    'available', 'unavailable', nullif(btrim(p_note), '');
end;
$$;

revoke
execute on function public.register_count_missing (uuid[], text)
from
  public,
  anon;

grant
execute on function public.register_count_missing (uuid[], text) to authenticated;
