create or replace function public.get_product_options () returns jsonb language sql stable as $$
  select jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(value order by uses desc, value)
      from (
        select category as value, count(*) as uses
        from products
        where is_active = true and category is not null
        group by category
      ) t
    ), '[]'::jsonb),
    'brands', coalesce((
      select jsonb_agg(value order by uses desc, value)
      from (
        select brand as value, count(*) as uses
        from products
        where is_active = true and brand is not null
        group by brand
      ) t
    ), '[]'::jsonb),
    'colors', coalesce((
      select jsonb_agg(value order by uses desc, value)
      from (
        select color as value, count(*) as uses
        from products
        where is_active = true and color is not null
        group by color
      ) t
    ), '[]'::jsonb),
    'sizes', coalesce((
      select jsonb_agg(value order by uses desc, value)
      from (
        select size as value, count(*) as uses
        from products
        where is_active = true and size is not null
        group by size
      ) t
    ), '[]'::jsonb)
  );
$$;
