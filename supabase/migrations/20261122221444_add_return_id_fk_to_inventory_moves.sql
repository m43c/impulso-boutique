alter table public.inventory_moves
add constraint inventory_moves_return_id_fkey foreign key (return_id) references public.returns (id);
