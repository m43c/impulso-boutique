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
  v_group_id    uuid;
  v_new_id      uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if nullif(btrim(p_image_public_id), '') is null then
    raise exception 'La imagen es obligatoria';
  end if;

  if nullif(btrim(p_name), '') is null or nullif(btrim(p_category), '') is null then
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
