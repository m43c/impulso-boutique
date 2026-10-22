alter table public.products
add column description text;

alter table public.products
add constraint chk_products_description_not_blank check (description ~ '\S'),
add constraint chk_products_description_length check (length(description) <= 200);
