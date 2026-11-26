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
      -- Pago: no aplica su propio filtro; sí devolución y usuario
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
              when 'cambio' then 'Cambio'
              else value
            end as label,
            count(*) as uses
          from (
            select coalesce(payment_method::text, 'cambio') as value
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

      -- Devolución: no aplica su propio filtro; sí pago y usuario
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
              or coalesce(payment_method::text, 'cambio') = any(p_payment_methods)
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

      -- Usuario: no aplica su propio filtro; sí pago y devolución
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
            or coalesce(payment_method::text, 'cambio') = any(p_payment_methods)
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
