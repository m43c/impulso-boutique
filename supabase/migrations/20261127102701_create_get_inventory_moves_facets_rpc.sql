create or replace function public.get_inventory_moves_facets (
  p_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_types text[] default null,
  p_reasons text[] default null,
  p_profile_ids uuid[] default null
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  v_search text;
begin
  if not public.is_admin () then
    raise exception 'Solo administradores pueden consultar movimientos'
      using errcode = '42501';
  end if;

  v_search := lower(extensions.unaccent (btrim (coalesce(p_search, ''))));

  return (
    with base as (
      select
        im.type,
        im.reason,
        im.profile_id,
        coalesce(pr.full_name, '—') as profile_name
      from public.inventory_moves im
      join public.product_units u on u.id = im.product_unit_id
      join public.products p on p.id = u.product_id
      left join public.profiles pr on pr.id = im.profile_id
      where (p_from is null or im.created_at >= p_from)
        and (p_to is null or im.created_at < p_to)
        and (
          v_search = ''
          or position(v_search in lower(extensions.unaccent (btrim (p.name)))) > 0
          or position(v_search in lower(extensions.unaccent (btrim (coalesce(pr.full_name, ''))))) > 0
          or position(v_search in lower(im.product_unit_id::text)) > 0
        )
    )
    select jsonb_build_object(
      'type', coalesce((
        select jsonb_agg(
          jsonb_build_object('value', value, 'label', label, 'count', uses)
          order by uses desc, label, value
        )
        from (
          select
            value,
            case value
              when 'entry' then 'Entrada'
              when 'exit' then 'Salida'
              when 'adjustment' then 'Ajuste'
              else value
            end as label,
            count(*) as uses
          from (
            select type::text as value
            from base
            where (
              p_reasons is null
              or cardinality(p_reasons) = 0
              or reason::text = any(p_reasons)
            )
            and (
              p_profile_ids is null
              or cardinality(p_profile_ids) = 0
              or profile_id = any(p_profile_ids)
            )
          ) filtered_type
          group by value
        ) type_options
      ), '[]'::jsonb),
      'reason', coalesce((
        select jsonb_agg(
          jsonb_build_object('value', value, 'label', label, 'count', uses)
          order by uses desc, label, value
        )
        from (
          select
            value,
            case value
              when 'purchase' then 'Compra'
              when 'sale' then 'Venta'
              when 'return' then 'Devolución'
              when 'exchange' then 'Cambio'
              when 'loss' then 'Pérdida'
              when 'damage' then 'Daño'
              when 'count' then 'Conteo'
              when 'correction' then 'Corrección'
              when 'review' then 'Revisión'
              else value
            end as label,
            count(*) as uses
          from (
            select reason::text as value
            from base
            where (
              p_types is null
              or cardinality(p_types) = 0
              or type::text = any(p_types)
            )
            and (
              p_profile_ids is null
              or cardinality(p_profile_ids) = 0
              or profile_id = any(p_profile_ids)
            )
          ) filtered_reason
          group by value
        ) reason_options
      ), '[]'::jsonb),
      'profile', coalesce((
        select jsonb_agg(
          jsonb_build_object('value', value, 'label', label, 'count', uses)
          order by uses desc, label, value
        )
        from (
          select
            profile_id as value,
            profile_name as label,
            count(*) as uses
          from base
          where (
            p_types is null
            or cardinality(p_types) = 0
            or type::text = any(p_types)
          )
          and (
            p_reasons is null
            or cardinality(p_reasons) = 0
            or reason::text = any(p_reasons)
          )
          group by profile_id, profile_name
        ) profile_options
      ), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.get_inventory_moves_facets (
  text,
  timestamptz,
  timestamptz,
  text[],
  text[],
  uuid[]
)
from
  public,
  anon;

grant
execute on function public.get_inventory_moves_facets (
  text,
  timestamptz,
  timestamptz,
  text[],
  text[],
  uuid[]
) to authenticated;
