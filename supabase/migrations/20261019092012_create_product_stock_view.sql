create or replace view public.product_stock
with
  (security_invoker = true) as
select
  p.id,
  count(u.id) filter (
    where
      u.status = 'available'
  ) as stock_available,
  count(u.id) filter (
    where
      u.status = 'sold'
  ) as stock_sold,
  count(u.id) filter (
    where
      u.status = 'returned'
  ) as stock_returned,
  count(u.id) filter (
    where
      u.status = 'unavailable'
  ) as stock_unavailable,
  count(u.id) as stock_total,
  (
    count(u.id) filter (
      where
        u.status = 'available'
    ) <= p.min_stock
  ) as is_low_stock
from
  public.products p
  left join public.product_units u on u.product_id = p.id
group by
  p.id;
