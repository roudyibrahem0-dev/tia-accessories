-- Run this once in Supabase when an older 3D-printing schema already exists.
alter table if exists public.products add column if not exists color_finish text;
alter table if exists public.products add column if not exists care_instructions text;
alter table if exists public.products add column if not exists warranty_text text default 'مقاوم للصدأ ولا يتغير لونه مع الماء';
alter table if exists public.general_inventory add column if not exists material text;
alter table if exists public.general_inventory add column if not exists price numeric(12,2) not null default 0;

alter table if exists public.products drop column if exists weight_grams;
alter table if exists public.products drop column if exists print_time_hours;
alter table if exists public.products drop column if exists color;

update public.orders set status = 'processing' where status = 'printing_started';
update public.orders set status = 'shipped' where status = 'printing_done';

drop table if exists public.product_inventory_requirements cascade;
drop table if exists public.filament_inventory cascade;