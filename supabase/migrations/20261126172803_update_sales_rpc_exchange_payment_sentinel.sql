create or replace function public.get_sales_page (
  p_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_payment_methods text[] default null,
  p_return_statuses text[] default null,
  p_profile_ids uuid[] default null,
  p_sort_by text default 'created_at',
  p_sort_dir text default 'desc',
  p_page_index integer default 0,
  p_page_size integer default 15
) returns table (
  id uuid,
  created_at timestamptz,
  profile_id uuid,
  profile_name text,
  payment_method public.payment_type,
  total_amount decimal(10, 2),
  items_count integer,
  returnable_until timestamptz,
  units public.recent_sale_item[],
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
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden consultar ventas'
      using errcode = '42501';
  end if;

  v_search := lower(extensions.unaccent (btrim (coalesce(p_search, ''))));
  v_sort_by := case
    when p_sort_by in ('created_at', 'total_amount') then p_sort_by
    else 'created_at'
  end;
  v_sort_dir := case
    when lower(coalesce(p_sort_dir, 'desc')) in ('asc', 'desc')
      then lower(coalesce(p_sort_dir, 'desc'))
    else 'desc'
  end;
  v_page_size := least(greatest(coalesce(p_page_size, 15), 1), 50);
  v_page_index := greatest(coalesce(p_page_index, 0), 0);

  return query
  with base as (
    select
      s.id,
      s.created_at,
      s.profile_id,
      coalesce(pr.full_name, '—') as profile_name,
      s.payment_method,
      s.total_amount,
      (
        select count(*)::integer
        from public.sale_details sd
        where sd.sale_id = s.id
      ) as items_count,
      s.created_at + interval '24 hours' as returnable_until,
      count(*) over () as total_count
    from public.sales s
    left join public.profiles pr on pr.id = s.profile_id
    where (
        case
          when p_from is null and p_to is null
            then s.created_at >= now() - interval '24 hours'
          else (p_from is null or s.created_at >= p_from)
           and (p_to is null or s.created_at < p_to)
        end
      )
      and (
        v_search = ''
        or exists (
          select 1
          from public.sale_details sd2
          join public.product_units pu2 on pu2.id = sd2.product_unit_id
          join public.products p2 on p2.id = pu2.product_id
          where sd2.sale_id = s.id
            and (
              position(v_search in lower(extensions.unaccent (p2.name))) > 0
              or position(v_search in lower(extensions.unaccent (coalesce(p2.color, '')))) > 0
              or position(v_search in lower(extensions.unaccent (coalesce(p2.size, '')))) > 0
            )
        )
      )
      and (
        p_payment_methods is null
        or cardinality(p_payment_methods) = 0
        or coalesce(s.payment_method::text, 'exchange') = any(p_payment_methods)
      )
      and (
        p_return_statuses is null
        or cardinality(p_return_statuses) = 0
        or (
          case
            when exists (
              select 1
              from public.sale_details sd3
              join public.returns r3 on r3.sale_detail_id = sd3.id
              where sd3.sale_id = s.id
            ) then 'with_returns'
            else 'without_returns'
          end
        ) = any(p_return_statuses)
      )
      and (
        p_profile_ids is null
        or cardinality(p_profile_ids) = 0
        or s.profile_id = any(p_profile_ids)
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
      case when v_sort_by = 'total_amount' and v_sort_dir = 'desc'
        then b.total_amount end desc nulls last,
      case when v_sort_by = 'total_amount' and v_sort_dir = 'asc'
        then b.total_amount end asc nulls last,
      b.id asc
    offset v_page_index * v_page_size
    limit v_page_size
  )
  select
    pr.id,
    pr.created_at,
    pr.profile_id,
    pr.profile_name,
    pr.payment_method,
    pr.total_amount,
    pr.items_count,
    pr.returnable_until,
    coalesce(
      array_agg(
        row(
          sd.product_unit_id,
          p.name,
          p.color,
          p.size,
          p.image_public_id,
          sd.unit_price,
          sd.id,
          lf.is_replacement_unit,
          lf.can_return,
          lf.can_refund,
          lf.return_info,
          lf.replaced_info
        )::public.recent_sale_item
        order by p.name, sd.product_unit_id
      ) filter (where sd.id is not null),
      array[]::public.recent_sale_item[]
    ) as units,
    pr.total_count
  from page_rows pr
  left join public.sale_details sd on sd.sale_id = pr.id
  left join public.product_units pu on pu.id = sd.product_unit_id
  left join public.products p on p.id = pu.product_id
  left join lateral (
    select
      exists (
        select 1
        from public.returns r
        where r.replacement_sale_detail_id = sd.id
      ) as is_replacement_unit,
      (
        not exists (
          select 1
          from public.returns r
          where r.sale_detail_id = sd.id
        )
        and pu.status = 'sold'
        and clock_timestamp() <= pr.created_at + interval '24 hours'
      ) as can_return,
      (
        not exists (
          select 1
          from public.returns r
          where r.sale_detail_id = sd.id
        )
        and pu.status = 'sold'
        and clock_timestamp() <= pr.created_at + interval '24 hours'
        and not exists (
          select 1
          from public.returns r
          where r.replacement_sale_detail_id = sd.id
        )
        and pr.payment_method is not null
      ) as can_refund,
      (
        select jsonb_build_object(
          'id', r.id,
          'type', r.type,
          'reason', r.reason,
          'note', r.note,
          'created_at', r.created_at,
          'profile_name', coalesce(rp.full_name, '—'),
          'replacement_unit_id', ru.id,
          'replacement_unit_code', left(ru.id::text, 8),
          'replacement_product_name', rproduct.name,
          'replacement_color', rproduct.color,
          'replacement_size', rproduct.size
        )
        from public.returns r
        left join public.profiles rp on rp.id = r.profile_id
        left join public.sale_details rsd on rsd.id = r.replacement_sale_detail_id
        left join public.product_units ru on ru.id = rsd.product_unit_id
        left join public.products rproduct on rproduct.id = ru.product_id
        where r.sale_detail_id = sd.id
      ) as return_info,
      (
        select jsonb_build_object(
          'unit_id', ru.id,
          'unit_code', left(ru.id::text, 8),
          'product_name', rproduct.name,
          'color', rproduct.color,
          'size', rproduct.size
        )
        from public.returns r
        join public.sale_details rsd on rsd.id = r.sale_detail_id
        join public.product_units ru on ru.id = rsd.product_unit_id
        join public.products rproduct on rproduct.id = ru.product_id
        where r.replacement_sale_detail_id = sd.id
      ) as replaced_info
    where sd.id is not null
  ) lf on true
  group by
    pr.id,
    pr.created_at,
    pr.profile_id,
    pr.profile_name,
    pr.payment_method,
    pr.total_amount,
    pr.items_count,
    pr.returnable_until,
    pr.total_count;
end;
$$;

revoke all on function public.get_sales_page (
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
execute on function public.get_sales_page (
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

create or replace function public.get_sales_facets (
  p_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_payment_methods text[] default null,
  p_return_statuses text[] default null,
  p_profile_ids uuid[] default null
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  v_search text;
begin
  if not public.is_admin_or_cashier () then
    raise exception 'Solo administradores y cajeros pueden consultar ventas'
      using errcode = '42501';
  end if;

  v_search := lower(extensions.unaccent (btrim (coalesce(p_search, ''))));

  return (
    with base as (
      select
        s.id,
        s.payment_method,
        s.profile_id,
        coalesce(pr.full_name, '—') as profile_name,
        exists (
          select 1
          from public.sale_details sd
          join public.returns r on r.sale_detail_id = sd.id
          where sd.sale_id = s.id
        ) as has_returns
      from public.sales s
      left join public.profiles pr on pr.id = s.profile_id
      where (
          case
            when p_from is null and p_to is null
              then s.created_at >= now() - interval '24 hours'
            else (p_from is null or s.created_at >= p_from)
             and (p_to is null or s.created_at < p_to)
          end
        )
        and (
          v_search = ''
          or exists (
            select 1
            from public.sale_details sd2
            join public.product_units pu2 on pu2.id = sd2.product_unit_id
            join public.products p2 on p2.id = pu2.product_id
            where sd2.sale_id = s.id
              and (
                position(v_search in lower(extensions.unaccent (p2.name))) > 0
                or position(v_search in lower(extensions.unaccent (coalesce(p2.color, '')))) > 0
                or position(v_search in lower(extensions.unaccent (coalesce(p2.size, '')))) > 0
              )
          )
        )
    )
    select jsonb_build_object(
      'payment_method', coalesce((
        select jsonb_agg(
          jsonb_build_object('value', value, 'label', label, 'count', uses)
          order by uses desc, label, value
        )
        from (
          select
            value,
            case value
              when 'cash' then 'Efectivo'
              when 'qr_transfer' then 'Transferencia QR'
              when 'exchange' then 'Cambio'
              else value
            end as label,
            count(*) as uses
          from (
            select coalesce(payment_method::text, 'exchange') as value
            from base
            where (
              p_return_statuses is null
              or cardinality(p_return_statuses) = 0
              or (case when has_returns then 'with_returns' else 'without_returns' end)
                 = any(p_return_statuses)
            )
            and (
              p_profile_ids is null
              or cardinality(p_profile_ids) = 0
              or profile_id = any(p_profile_ids)
            )
          ) filtered_payment
          group by value
        ) payment_options
      ), '[]'::jsonb),

      'return_status', coalesce((
        select jsonb_agg(
          jsonb_build_object('value', value, 'label', label, 'count', uses)
          order by uses desc, label, value
        )
        from (
          select
            value,
            case value
              when 'with_returns' then 'Con devoluciones'
              else 'Sin devoluciones'
            end as label,
            count(*) as uses
          from (
            select case when has_returns then 'with_returns' else 'without_returns' end as value
            from base
            where (
              p_payment_methods is null
              or cardinality(p_payment_methods) = 0
              or coalesce(payment_method::text, 'exchange') = any(p_payment_methods)
            )
            and (
              p_profile_ids is null
              or cardinality(p_profile_ids) = 0
              or profile_id = any(p_profile_ids)
            )
          ) filtered_return
          group by value
        ) return_options
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
            p_payment_methods is null
            or cardinality(p_payment_methods) = 0
            or coalesce(payment_method::text, 'exchange') = any(p_payment_methods)
          )
          and (
            p_return_statuses is null
            or cardinality(p_return_statuses) = 0
            or (case when has_returns then 'with_returns' else 'without_returns' end)
               = any(p_return_statuses)
          )
          group by profile_id, profile_name
        ) profile_options
      ), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.get_sales_facets (
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
execute on function public.get_sales_facets (
  text,
  timestamptz,
  timestamptz,
  text[],
  text[],
  uuid[]
) to authenticated;
