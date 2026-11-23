alter table public.inventory_moves
drop constraint chk_inventory_moves_type_reason;

alter table public.inventory_moves
add constraint chk_inventory_moves_type_reason check (
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
    and reason in ('count', 'correction', 'review')
  )
);
