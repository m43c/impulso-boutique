create table public.products (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  category text not null,
  brand text,
  color text,
  size text,
  price decimal(10, 2) not null,
  image_url text,
  min_stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_products_name_not_blank check (name ~ '\S'),
  constraint chk_products_name_length check (length(name) <= 200),
  constraint chk_products_category_not_blank check (category ~ '\S'),
  constraint chk_products_category_length check (length(category) <= 100),
  constraint chk_products_brand_not_blank check (brand ~ '\S'),
  constraint chk_products_brand_length check (length(brand) <= 100),
  constraint chk_products_color_not_blank check (color ~ '\S'),
  constraint chk_products_color_length check (length(color) <= 50),
  constraint chk_products_size_not_blank check (size ~ '\S'),
  constraint chk_products_size_length check (length(size) <= 20),
  constraint chk_products_price_positive check (price > 0),
  constraint chk_products_image_url_format check (image_url ~ '^https?://\S+$'),
  constraint chk_products_min_stock_non_negative check (min_stock >= 0)
);

create unique index uq_products_identity on public.products (
  lower(name),
  lower(category),
  lower(coalesce(brand, '')),
  lower(coalesce(color, '')),
  lower(coalesce(size, ''))
)
where
  is_active = true;

create trigger set_products_updated_at before
update on public.products for each row
execute function public.set_updated_at ();
