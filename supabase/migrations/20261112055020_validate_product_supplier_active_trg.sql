create or replace function public.validate_product_supplier_active () returns trigger language plpgsql security definer
set
  search_path = public as $$
declare
  v_is_active boolean;
begin
  if new.supplier_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.supplier_id is not distinct from old.supplier_id then
      return new;
    end if;
  end if;

  select is_active
    into v_is_active
    from public.suppliers
   where id = new.supplier_id
     for share;

  if not found or not v_is_active then
    raise exception 'El proveedor seleccionado no está activo'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger validate_product_supplier_active before insert
or
update of supplier_id on public.products for each row
execute function public.validate_product_supplier_active ();
