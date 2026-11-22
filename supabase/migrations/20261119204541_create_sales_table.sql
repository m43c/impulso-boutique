create type payment_type as enum('cash', 'qr_transfer');

create table public.sales (
  id uuid primary key default gen_random_uuid (),
  profile_id uuid not null references public.profiles (id),
  total_amount decimal(10, 2) not null,
  payment_method payment_type,
  created_at timestamptz not null default clock_timestamp(),
  constraint chk_sales_total_non_negative check (total_amount >= 0),
  constraint chk_sales_payment_matches_total check ((payment_method is null) = (total_amount = 0))
);

create or replace function public.prevent_immutable_changes () returns trigger language plpgsql
set
  search_path = public as $$
begin
  raise exception 'Los registros de % son de solo lectura y no pueden modificarse', tg_table_name;
end;
$$;

create trigger set_sales_immutable before
update
or delete on public.sales for each row
execute function public.prevent_immutable_changes ();
