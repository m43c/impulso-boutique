create type public.recent_sale_item as (
  unit_id uuid,
  product_name text,
  color text,
  size text,
  image_public_id text,
  unit_price decimal(10, 2)
);
