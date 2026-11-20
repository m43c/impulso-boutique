create or replace function public.resolve_unit_code (p_code text) returns table (
  id uuid,
  product_id uuid,
  status public.product_unit_status,
  product_name text,
  is_active boolean,
  price decimal(10, 2),
  color text,
  size text,
  image_public_id text
) language plpgsql stable security definer
set
  search_path = public as $$
declare
  v_code    text := lower (btrim (coalesce(p_code, '')));
  v_is_full boolean;
  v_matches integer;
begin
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden resolver códigos de venta'
      using errcode = '42501';
  end if;

  if v_code !~ '^[0-9a-f]{8}$'
     and v_code !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Formato de código inválido'
      using errcode = '22P02';
  end if;

  v_is_full := length(v_code) = 36;

  if not v_is_full then
    select count(*) into v_matches
      from public.product_units pu
     where left(pu.id::text, 8) = v_code;

    if v_matches > 1 then
      raise exception 'Código ambiguo: escriba más caracteres'
        using errcode = 'S6008';
    end if;
  end if;

  if v_is_full then
    return query
    select
      pu.id,
      pu.product_id,
      pu.status,
      p.name,
      p.is_active,
      p.price,
      p.color,
      p.size,
      p.image_public_id
    from public.product_units pu
    join public.products p on p.id = pu.product_id
    where pu.id = v_code::uuid;
  else
    return query
    select
      pu.id,
      pu.product_id,
      pu.status,
      p.name,
      p.is_active,
      p.price,
      p.color,
      p.size,
      p.image_public_id
    from public.product_units pu
    join public.products p on p.id = pu.product_id
    where left(pu.id::text, 8) = v_code;
  end if;
end;
$$;

revoke all on function public.resolve_unit_code (text)
from
  public,
  anon;

grant
execute on function public.resolve_unit_code (text) to authenticated;
