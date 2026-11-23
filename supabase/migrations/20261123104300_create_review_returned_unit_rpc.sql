create or replace function public.review_returned_unit (
  p_unit_id uuid,
  p_approve boolean,
  p_note text default null
) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_status     public.product_unit_status;
  v_new_status public.product_unit_status;
  v_note       text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_admin () then
    raise exception 'Solo administradores pueden revisar devoluciones'
      using errcode = '42501';
  end if;

  if p_approve is null then
    raise exception 'Debe indicar si aprueba o descarta la devolución'
      using errcode = 'S7010';
  end if;

  select pu.status
    into v_status
    from public.product_units pu
   where pu.id = p_unit_id
     for update;

  if not found then
    raise exception 'La unidad indicada no existe'
      using errcode = 'S6004', detail = p_unit_id::text;
  end if;

  if v_status is distinct from 'returned' then
    raise exception 'La unidad no está en revisión'
      using errcode = 'S7008', detail = p_unit_id::text;
  end if;

  if p_approve then
    v_new_status := 'available';
  else
    v_new_status := 'unavailable';
  end if;

  update public.product_units
     set status = v_new_status
   where id = p_unit_id;

  insert into public.inventory_moves (
    product_unit_id,
    profile_id,
    type,
    reason,
    previous_status,
    new_status,
    note
  )
  values (
    p_unit_id,
    auth.uid (),
    'adjustment',
    'review',
    'returned',
    v_new_status,
    v_note
  );
end;
$$;

revoke all on function public.review_returned_unit (uuid, boolean, text)
from
  public,
  anon;

grant
execute on function public.review_returned_unit (uuid, boolean, text) to authenticated;
