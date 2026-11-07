-- 1. register_entry
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
    raise exception 'Solo administradores pueden registrar entradas de inventario'
      using errcode = '42501';
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
    select p_product_id from generate_series(1, p_quantity)
    returning id
  ),
  new_moves as (
    insert into public.inventory_moves (
      product_unit_id, profile_id, type, reason,
      previous_status, new_status, note
    )
    select id, auth.uid(), v_type, p_reason,
           null, 'available'::public.product_unit_status, p_note
    from new_units
    returning product_unit_id
  )
  select id from new_units;
end;
$$;

-- 2. register_exit
create or replace function public.register_exit (
  p_unit_id uuid,
  p_reason public.move_reason,
  p_note text default null
) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_status public.product_unit_status;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden registrar salidas de inventario'
      using errcode = '42501';
  end if;

  if p_reason is null or p_reason not in ('loss', 'damage') then
    raise exception 'Razón % no es válida para una salida manual', p_reason;
  end if;

  select status into v_status
    from public.product_units
   where id = p_unit_id
     for update;

  if not found then
    raise exception 'La unidad no existe';
  end if;

  if v_status <> 'available' then
    raise exception
      'Solo se pueden dar de baja unidades disponibles (estado actual: %). Actualiza la lista e inténtalo de nuevo',
      v_status;
  end if;

  update public.product_units
     set status = 'unavailable'
   where id = p_unit_id;

  insert into public.inventory_moves (
    product_unit_id, profile_id, type, reason,
    previous_status, new_status, note
  ) values (
    p_unit_id, auth.uid(), 'exit', p_reason,
    'available', 'unavailable', nullif(btrim(p_note), '')
  );
end;
$$;

-- 3. reactivate_unit
create or replace function public.reactivate_unit (p_unit_id uuid, p_note text default null) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_status public.product_unit_status;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden reactivar unidades'
      using errcode = '42501';
  end if;

  select status into v_status
    from public.product_units
   where id = p_unit_id
     for update;

  if not found then
    raise exception 'La unidad no existe';
  end if;

  if v_status <> 'unavailable' then
    raise exception
      'Solo se pueden reactivar unidades no disponibles (estado actual: %). Actualiza la lista e inténtalo de nuevo',
      v_status;
  end if;

  update public.product_units
     set status = 'available'
   where id = p_unit_id;

  insert into public.inventory_moves (
    product_unit_id, profile_id, type, reason,
    previous_status, new_status, note
  ) values (
    p_unit_id, auth.uid(), 'adjustment', 'correction',
    'unavailable', 'available', nullif(btrim(p_note), '')
  );
end;
$$;

-- 4. register_count_missing
create or replace function public.register_count_missing (p_unit_ids uuid[], p_note text default null) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_count     int;
  v_found     int;
  v_not_avail int;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden registrar conteos físicos'
      using errcode = '42501';
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
    raise exception 'Una o más unidades no existen. Actualiza la lista e inténtalo de nuevo';
  end if;

  select count(*) into v_not_avail
    from public.product_units
   where id = any(p_unit_ids)
     and status <> 'available';

  if v_not_avail > 0 then
    raise exception 'Al menos una unidad ya no está disponible. Actualiza la lista e inténtalo de nuevo';
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

-- 5. create_product_variant
create or replace function public.create_product_variant (
  p_source_id uuid,
  p_name text,
  p_description text,
  p_category text,
  p_brand text,
  p_color text,
  p_size text,
  p_price numeric,
  p_min_stock integer,
  p_image_public_id text
) returns uuid language plpgsql security definer
set
  search_path = public as $$
declare
  v_group_id uuid;
  v_new_id   uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_image_public_id), '') is null then
    raise exception 'La imagen es obligatoria';
  end if;

  if nullif(btrim(p_name), '') is null
     or nullif(btrim(p_category), '') is null then
    raise exception 'El nombre y la categoría son obligatorios';
  end if;

  if p_price is null or p_price <= 0 then
    raise exception 'El precio debe ser mayor a 0';
  end if;

  select variant_group_id
    into v_group_id
    from public.products
   where id = p_source_id
     for update;

  if not found then
    raise exception 'El producto origen no existe';
  end if;

  if v_group_id is null then
    v_group_id := gen_random_uuid();

    update public.products
       set variant_group_id = v_group_id
     where id = p_source_id;
  end if;

  insert into public.products (
    name, description, category, brand, color, size,
    price, image_public_id, min_stock, variant_group_id
  )
  values (
    btrim(p_name),
    nullif(btrim(p_description), ''),
    btrim(p_category),
    nullif(btrim(p_brand), ''),
    nullif(btrim(p_color), ''),
    nullif(btrim(p_size), ''),
    p_price,
    btrim(p_image_public_id),
    coalesce(p_min_stock, 0),
    v_group_id
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- 6. prevent_move_changes
create or replace function public.prevent_move_changes () returns trigger language plpgsql
set
  search_path = public as $$
begin
  raise exception 'Los movimientos de inventario son de solo lectura y no pueden modificarse';
end;
$$;

-- Permissions (idempotent)
revoke all on function public.register_entry (uuid, integer, public.move_reason, text)
from
  public,
  anon;

grant
execute on function public.register_entry (uuid, integer, public.move_reason, text) to authenticated;

revoke all on function public.register_exit (uuid, public.move_reason, text)
from
  public,
  anon;

grant
execute on function public.register_exit (uuid, public.move_reason, text) to authenticated;

revoke all on function public.reactivate_unit (uuid, text)
from
  public,
  anon;

grant
execute on function public.reactivate_unit (uuid, text) to authenticated;

revoke all on function public.register_count_missing (uuid[], text)
from
  public,
  anon;

grant
execute on function public.register_count_missing (uuid[], text) to authenticated;

revoke all on function public.create_product_variant (
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  text
)
from
  public,
  anon;

grant
execute on function public.create_product_variant (
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  text
) to authenticated;
