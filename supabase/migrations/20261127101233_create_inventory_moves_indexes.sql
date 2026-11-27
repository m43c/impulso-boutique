create index if not exists idx_inventory_moves_created_at_id_desc on public.inventory_moves (created_at desc, id);

create index if not exists idx_inventory_moves_created_at_id_asc on public.inventory_moves (created_at asc, id);

create index if not exists idx_inventory_moves_profile_id on public.inventory_moves (profile_id);

create index if not exists idx_inventory_moves_type on public.inventory_moves (type);

create index if not exists idx_inventory_moves_reason on public.inventory_moves (reason);
