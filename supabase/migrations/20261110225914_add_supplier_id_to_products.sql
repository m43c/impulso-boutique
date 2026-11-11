alter table public.products
add column supplier_id uuid references public.suppliers (id) on delete restrict;

create index idx_products_supplier_id on public.products (supplier_id);
