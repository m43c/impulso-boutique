create type public.user_role as enum('admin', 'advisor', 'cashier');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_profiles_full_name_format check (
    length(trim(full_name)) >= 5
    and trim(full_name) ~ ' '
    and trim(full_name) ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'' -]+$'
  )
);

create or replace function public.set_updated_at () returns trigger language plpgsql as $$
begin 
  new.updated_at = now();
  return new;
end
$$;

create trigger set_profiles_updated_at before
update on public.profiles for each row
execute function public.set_updated_at ();
