alter table public.inventory_moves
add constraint inventory_moves_sale_id_fkey foreign key (sale_id) references public.sales (id);
