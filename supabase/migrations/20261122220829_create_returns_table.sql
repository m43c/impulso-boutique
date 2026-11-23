create type return_type as enum('refund', 'exchange');

create type return_reason as enum(
  'wrong_size',
  'wrong_color',
  'defective',
  'not_as_expected',
  'changed_mind',
  'wrong_item_delivered',
  'sale_error',
  'other'
);

create table public.returns (
  id uuid primary key default gen_random_uuid (),
  sale_detail_id uuid not null unique references public.sale_details (id),
  profile_id uuid not null references public.profiles (id),
  replacement_sale_detail_id uuid unique references public.sale_details (id),
  type return_type not null,
  reason return_reason not null,
  note text,
  created_at timestamptz not null default clock_timestamp(),
  constraint chk_returns_exchange_has_replacement check (
    (type = 'exchange') = (replacement_sale_detail_id is not null)
  ),
  constraint chk_returns_replacement_differs check (replacement_sale_detail_id <> sale_detail_id)
);

create trigger set_returns_immutable before
update
or delete on public.returns for each row
execute function public.prevent_immutable_changes ();
