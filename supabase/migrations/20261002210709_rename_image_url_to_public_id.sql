alter table public.products
drop constraint if exists chk_products_image_url_format;

alter table public.products
rename column image_url to image_public_id;

alter table public.products
add constraint chk_products_image_public_id_not_blank check (image_public_id ~ '\S');

alter table public.products
add constraint chk_products_image_public_id_length check (length(image_public_id) <= 255);
