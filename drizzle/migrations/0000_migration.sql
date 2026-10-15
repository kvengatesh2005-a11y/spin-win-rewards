create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  coins int not null default 500,
  free_spins int not null default 0,
  games_played int not null default 0,
  referral_code text unique not null default upper(substr(md5(random()::text),1,6)),
  referred_by uuid,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "update own name" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- only name may be changed by users
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🎁',
  image_url text,
  level int not null check (level in (1,2,3)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to authenticated, anon; grant insert, update, delete on public.products to authenticated; grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "anyone reads products" on public.products for select to anon, authenticated using (true);
create policy "admin inserts products" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin updates products" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes products" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  level int not null,
  cost int not null,
  won boolean not null,
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.spins to authenticated; grant all on public.spins to service_role;
alter table public.spins enable row level security;
create policy "own spins" on public.spins for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  spin_id uuid references public.spins(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_emoji text not null default '🎁',
  status text not null default 'awaiting_address' check (status in ('awaiting_address','confirmed','shipped','delivered')),
  full_name text, phone text, address_line text, city text, pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated; grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "read own orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin updates orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- signup: profile, role (first user = admin), referral reward
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare ref_id uuid; ref_count int;
begin
  select id into ref_id from public.profiles where referral_code = upper(coalesce(new.raw_user_meta_data->>'ref',''));
  insert into public.profiles(id, name, referred_by) values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), ref_id);
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  end if;
  insert into public.user_roles(user_id, role) values (new.id,'user');
  if ref_id is not null then
    select count(*) into ref_count from public.profiles where referred_by = ref_id;
    if ref_count % 3 = 0 then update public.profiles set free_spins = free_spins + 1 where id = ref_id; end if;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- spin: server decides result
create or replace function public.spin_wheel(_level int) returns json language plpgsql security definer set search_path=public as $$
declare p public.profiles; cost int; need int; prod public.products; did_win boolean; sid uuid; oid uuid; used_free boolean := false;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if _level not in (1,2,3) then raise exception 'Bad level'; end if;
  select * into p from public.profiles where id = auth.uid() for update;
  cost := case _level when 1 then 20 when 2 then 50 else 100 end;
  need := case _level when 1 then 0 when 2 then 5 else 10 end;
  if p.games_played < need then raise exception 'Play % games to unlock this level', need; end if;
  if _level = 1 and p.free_spins > 0 then used_free := true; cost := 0;
  elsif p.coins < cost then raise exception 'Not enough coins'; end if;
  if _level in (1,2) then did_win := true; else did_win := random() < 0.10; end if;
  if did_win then
    select * into prod from public.products where level = _level and active order by random() limit 1;
    if prod.id is null then raise exception 'No prizes available for this level yet'; end if;
  end if;
  update public.profiles set coins = coins - cost, free_spins = free_spins - (case when used_free then 1 else 0 end), games_played = games_played + 1 where id = p.id;
  insert into public.spins(user_id, level, cost, won, product_id) values (p.id, _level, cost, did_win, prod.id) returning id into sid;
  if did_win then
    insert into public.orders(user_id, spin_id, product_id, product_name, product_emoji) values (p.id, sid, prod.id, prod.name, prod.emoji) returning id into oid;
  end if;
  return json_build_object('won', did_win, 'product_id', prod.id, 'product_name', prod.name, 'product_emoji', prod.emoji, 'order_id', oid, 'used_free', used_free);
end $$;
grant execute on function public.spin_wheel(int) to authenticated;

create or replace function public.submit_address(_order_id uuid, _full_name text, _phone text, _address text, _city text, _pincode text) returns void language plpgsql security definer set search_path=public as $$
begin
  if length(trim(_full_name))<2 or _phone !~ '^[0-9]{10}$' or length(trim(_address))<5 or length(trim(_city))<2 or _pincode !~ '^[0-9]{6}$' then raise exception 'Please fill all address fields correctly'; end if;
  update public.orders set full_name=_full_name, phone=_phone, address_line=_address, city=_city, pincode=_pincode, status='confirmed', updated_at=now()
  where id=_order_id and user_id=auth.uid() and status='awaiting_address';
  if not found then raise exception 'Order not found'; end if;
end $$;
grant execute on function public.submit_address(uuid,text,text,text,text,text) to authenticated;

create or replace function public.referral_count() returns int language sql stable security definer set search_path=public as $$ select count(*)::int from public.profiles where referred_by = auth.uid() $$;
grant execute on function public.referral_count() to authenticated;

insert into public.products(name, emoji, level) values
('Wireless Earbuds','🎧',1),('Steel Water Bottle','🥤',1),('Phone Stand','📱',1),('Chocolate Box','🍫',1),('Key Chain','🔑',1),('Coffee Mug','☕',1),
('Smart Watch','⌚',2),('Bluetooth Speaker','🔊',2),('Power Bank','🔋',2),('Backpack','🎒',2),('Sunglasses','🕶️',2),('Headphones','🎧',2),
('Smartphone','📱',3),('Gold Coin','🪙',3),('Tablet','💻',3);