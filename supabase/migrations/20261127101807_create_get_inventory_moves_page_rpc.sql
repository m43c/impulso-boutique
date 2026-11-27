create or replace function public.get_inventory_moves_page (
  p_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_types text[] default null,
  p_reasons text[] default null,
  p_profile_ids uuid[] default null,
  p_sort_by text default 'created_at',
  p_sort_dir text default 'desc',
  p_page_index integer default 0,
  p_page_size integer default 10
) returns table (
  id uuid,
  created_at timestamptz,
  product_unit_id uuid,
  product_id uuid,
  product_name text,
  product_is_active boolean,
  type move_type,
  reason move_reason,
  previous_status product_unit_status,
  new_status product_unit_status,
  note text,
  sale_id uuid,
  return_id uuid,
  profile_id uuid,
  profile_name text,
  total_count bigint
) language plpgsql security definer
set
  search_path = public as $$
declare
  v_search text;
  v_sort_by text;
  v_sort_dir text;
  v_page_size integer;
  v_page_index integer;
begin
  if not public.is_admin () then
    raise exception 'Solo administradores pueden consultar movimientos'
      using errcode = '42501';
  end if;

  v_search := lower(extensions.unaccent (btrim (coalesce(p_search, ''))));
  v_sort_by := case
    when p_sort_by in ('created_at', 'product_name', 'type', 'profile_name') then p_sort_by
    else 'created_at'
  end;
  v_sort_dir := case
    when lower(coalesce(p_sort_dir, 'desc')) in ('asc', 'desc')
      then lower(coalesce(p_sort_dir, 'desc'))
    else 'desc'
  end;
  v_page_size := least(greatest(coalesce(p_page_size, 10), 1), 50);
  v_page_index := greatest(coalesce(p_page_index, 0), 0);

  return query
  with base as (
    select
      im.id,
      im.created_at,
      im.product_unit_id,
      u.product_id,
      p.name as product_name,
      p.is_active as product_is_active,
      im.type,
      im.reason,
      im.previous_status,
      im.new_status,
      im.note,
      im.sale_id,
      im.return_id,
      im.profile_id,
      coalesce(pr.full_name, '—') as profile_name,
      count(*) over () as total_count
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
      and (
        p_types is null
        or cardinality(p_types) = 0
        or im.type::text = any(p_types)
      )
      and (
        p_reasons is null
        or cardinality(p_reasons) = 0
        or im.reason::text = any(p_reasons)
      )
      and (
        p_profile_ids is null
        or cardinality(p_profile_ids) = 0
        or im.profile_id = any(p_profile_ids)
      )
  ),
  page_rows as (
    select b.*
    from base b
    order by
      case when v_sort_by = 'created_at' and v_sort_dir = 'desc'
        then b.created_at end desc nulls last,
      case when v_sort_by = 'created_at' and v_sort_dir = 'asc'
        then b.created_at end asc nulls last,
      case when v_sort_by = 'product_name' and v_sort_dir = 'desc'
        then lower(b.product_name) end desc nulls last,
      case when v_sort_by = 'product_name' and v_sort_dir = 'asc'
        then lower(b.product_name) end asc nulls last,
      case when v_sort_by = 'type' and v_sort_dir = 'desc'
        then b.type::text end desc nulls last,
      case when v_sort_by = 'type' and v_sort_dir = 'asc'
        then b.type::text end asc nulls last,
      case when v_sort_by = 'profile_name' and v_sort_dir = 'desc'
        then lower(b.profile_name) end desc nulls last,
      case when v_sort_by = 'profile_name' and v_sort_dir = 'asc'
        then lower(b.profile_name) end asc nulls last,
      b.id asc
    offset v_page_index * v_page_size
    limit v_page_size
  )
  select
    pr.id,
    pr.created_at,
    pr.product_unit_id,
    pr.product_id,
    pr.product_name,
    pr.product_is_active,
    pr.type,
    pr.reason,
    pr.previous_status,
    pr.new_status,
    pr.note,
    pr.sale_id,
    pr.return_id,
    pr.profile_id,
    pr.profile_name,
    pr.total_count
  from page_rows pr;
end;
$$;

revoke all on function public.get_inventory_moves_page (
  text,
  timestamptz,
  timestamptz,
  text[],
  text[],
  uuid[],
  text,
  text,
  integer,
  integer
)
from
  public,
  anon;

grant
execute on function public.get_inventory_moves_page (
  text,
  timestamptz,
  timestamptz,
  text[],
  text[],
  uuid[],
  text,
  text,
  integer,
  integer
) to authenticated;
