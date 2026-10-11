create type move_type as enum('entry', 'exit', 'adjustment');

create type move_reason as enum(
  'purchase',
  'sale',
  'return',
  'exchange',
  'loss',
  'damage',
  'count',
  'correction'
);

create table public.inventory_moves (
  id uuid primary key default gen_random_uuid (),
  product_unit_id uuid not null references public.product_units (id),
  profile_id uuid not null references public.profiles (id),
  sale_id uuid,
  return_id uuid,
  type move_type not null,
  reason move_reason not null,
  previous_status product_unit_status,
  new_status product_unit_status not null,
  note text,
  created_at timestamptz not null default now(),
  constraint chk_inventory_moves_type_reason check (
    (
      type = 'entry'
      and reason in ('purchase', 'return', 'exchange')
    )
    or (
      type = 'exit'
      and reason in ('sale', 'exchange', 'loss', 'damage')
    )
    or (
      type = 'adjustment'
      and reason in ('count', 'correction')
    )
  ),
  constraint chk_inventory_moves_sale_link check (
    sale_id is null
    or reason in ('sale', 'exchange')
  ),
  constraint chk_inventory_moves_return_link check (
    return_id is null
    or reason in ('return', 'exchange')
  ),
  constraint chk_inventory_moves_status_changed check (previous_status is distinct from new_status)
);

create or replace function public.prevent_move_changes () returns trigger language plpgsql as $$
begin
  raise exception 'inventory_moves is insert-only';
end $$;

create trigger set_inventory_moves_immutable before
update
or delete on public.inventory_moves for each row
execute function public.prevent_move_changes ();
