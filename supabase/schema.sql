-- =====================================================================
-- Simulasi Bisnis: Dari Ide ke Pasar · database pasar daring (Supabase)
-- Prinsip keamanan:
--   1. Semua tabel bisa DIBACA (untuk papan pasar), tetapi tidak bisa
--      DIUBAH langsung. Semua perubahan lewat fungsi di bawah.
--   2. Kunci fasilitator dan token pemain disimpan di tabel terpisah
--      yang sama sekali tidak bisa dibaca dari luar.
--   3. Fungsi beli mengecek semua aturan dalam satu transaksi:
--      pasar dibuka, ronde tim, bukan tim sendiri, maksimal per tim,
--      stok, dan saldo. Baris tim dan pembeli dikunci agar tidak bentrok.
-- =====================================================================

create table if not exists public.sessions(
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null default 'Simulasi Bisnis',
  team_count int not null default 20,
  round_count int not null default 4,
  budget int not null default 20000,          -- uang virtual per pembeli per ronde
  max_per_team int not null default 1,        -- maksimal pembelian dari tim yang sama
  status text not null default 'setup',       -- setup | market | closed
  round int not null default 0,               -- ronde aktif
  phase text not null default 'idle',         -- idle | pitch | buy | done
  fx_vc_pct int not null default 0,           -- efek kartu: kenaikan biaya variabel (%)
  fx_fc_add int not null default 0,           -- efek kartu: tambahan biaya tetap (Rp)
  bundle boolean not null default false,      -- efek kartu: promo paket 2 produk
  events jsonb not null default '[]'::jsonb,  -- kartu kejadian yang sudah dipakai
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_keys(
  session_id uuid primary key references public.sessions(id) on delete cascade,
  admin_key text not null
);

create table if not exists public.teams(
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  number int not null,
  name text not null default '',
  members text not null default '',
  product text not null default '',
  unit text not null default 'produk',
  tagline text not null default '',
  uniques text not null default '',
  price int not null default 0,
  bundle_price int not null default 0,
  vc int not null default 0,
  fc int not null default 0,
  qty int not null default 0,
  loss int not null default 0,
  round int not null default 1,
  plan jsonb,
  updated_at timestamptz not null default now(),
  unique(session_id, number)
);

create table if not exists public.players(
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null,
  team_number int not null,
  is_rep boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists one_rep_per_team on public.players(session_id, team_number) where is_rep;

create table if not exists public.player_keys(
  player_id uuid primary key references public.players(id) on delete cascade,
  token text not null unique
);

create table if not exists public.sales(
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  buyer_id uuid references public.players(id) on delete set null,
  round int not null,
  units int not null default 1,
  amount int not null,
  is_bundle boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sales_session_idx on public.sales(session_id);
create index if not exists sales_buyer_idx on public.sales(buyer_id);
create index if not exists sales_team_idx on public.sales(team_id);
create index if not exists teams_session_idx on public.teams(session_id);
create index if not exists players_session_idx on public.players(session_id);

-- ---------- hak akses: baca boleh, ubah langsung tidak ----------
alter table public.sessions enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.sales enable row level security;
alter table public.session_keys enable row level security;
alter table public.player_keys enable row level security;

drop policy if exists "baca sesi" on public.sessions;
drop policy if exists "baca tim" on public.teams;
drop policy if exists "baca pemain" on public.players;
drop policy if exists "baca penjualan" on public.sales;
create policy "baca sesi" on public.sessions for select using (true);
create policy "baca tim" on public.teams for select using (true);
create policy "baca pemain" on public.players for select using (true);
create policy "baca penjualan" on public.sales for select using (true);

revoke all on public.sessions, public.teams, public.players, public.sales, public.session_keys, public.player_keys from anon, authenticated;
grant select on public.sessions, public.teams, public.players, public.sales to anon, authenticated;

-- ---------- fungsi bantu ----------
create or replace function public._token() returns text language sql volatile as $$
  select replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')
$$;

create or replace function public._code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random()*31)::int, 1), '')
  from generate_series(1,5)
$$;

create or replace function public._int(v text, fallback int) returns int language sql immutable as $$
  select case when v is null or v = '' then fallback
              when v ~ '^-?[0-9]+(\.[0-9]+)?$' then round(v::numeric)::int
              else fallback end
$$;

create or replace function public._me(p_token text) returns public.players
language plpgsql stable security definer set search_path = public as $$
declare me players;
begin
  select p.* into me from players p join player_keys k on k.player_id = p.id where k.token = p_token;
  if not found then raise exception 'Akun permainan Anda tidak dikenali. Silakan gabung ulang.'; end if;
  return me;
end $$;

create or replace function public._admin(p_code text, p_key text) returns public.sessions
language plpgsql stable security definer set search_path = public as $$
declare s sessions;
begin
  select x.* into s from sessions x join session_keys k on k.session_id = x.id
  where x.code = upper(trim(p_code)) and k.admin_key = p_key;
  if not found then raise exception 'Kunci fasilitator tidak cocok untuk sesi ini.'; end if;
  return s;
end $$;

-- ---------- fasilitator ----------
create or replace function public.create_session(p_name text, p_team_count int, p_round_count int, p_budget int)
returns json language plpgsql security definer set search_path = public as $$
declare s sessions; k text; c text; i int; per int;
begin
  if p_team_count < 2 or p_team_count > 40 then raise exception 'Jumlah tim harus 2 sampai 40.'; end if;
  if p_round_count < 1 or p_round_count > p_team_count then raise exception 'Jumlah ronde tidak valid.'; end if;
  if p_budget < 1000 then raise exception 'Uang virtual per ronde terlalu kecil.'; end if;
  loop c := _code(); exit when not exists(select 1 from sessions where code = c); end loop;
  insert into sessions(code, name, team_count, round_count, budget)
  values (c, coalesce(nullif(trim(p_name),''),'Simulasi Bisnis'), p_team_count, p_round_count, p_budget)
  returning * into s;
  k := _token();
  insert into session_keys values (s.id, k);
  per := ceil(p_team_count::numeric / p_round_count);
  for i in 1..p_team_count loop
    insert into teams(session_id, number, round) values (s.id, i, ceil(i::numeric / per));
  end loop;
  return json_build_object('id', s.id, 'code', s.code, 'admin_key', k);
end $$;

create or replace function public.admin_check(p_code text, p_key text) returns json
language plpgsql stable security definer set search_path = public as $$
declare s sessions;
begin s := _admin(p_code, p_key); return json_build_object('id', s.id, 'code', s.code); end $$;

-- Ubah pengaturan sesi: nama, uang per ronde, batas per tim, status, ronde, fase, promo paket
create or replace function public.admin_update(p_code text, p_key text, p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions;
begin
  s := _admin(p_code, p_key);
  update sessions set
    name = coalesce(nullif(trim(p->>'name'),''), name),
    budget = greatest(1000, _int(p->>'budget', budget)),
    max_per_team = greatest(1, _int(p->>'max_per_team', max_per_team)),
    round = greatest(0, least(round_count, _int(p->>'round', round))),
    phase = case when p ? 'phase' and p->>'phase' in ('idle','pitch','buy','done') then p->>'phase' else phase end,
    status = case when p ? 'status' and p->>'status' in ('setup','market','closed') then p->>'status' else status end,
    bundle = case when p ? 'bundle' then (p->>'bundle')::boolean else bundle end,
    updated_at = now()
  where id = s.id;
  return json_build_object('ok', true);
end $$;

-- Buka pasar: produksi, biaya, dan harga awal setiap tim disimpan sebagai rencana
create or replace function public.admin_open_market(p_code text, p_key text) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions;
begin
  s := _admin(p_code, p_key);
  update teams set plan = jsonb_build_object('price', price, 'vc', vc, 'fc', fc, 'qty', qty) where session_id = s.id;
  update sessions set status = 'market', round = 1, phase = 'pitch', updated_at = now() where id = s.id;
  return json_build_object('ok', true);
end $$;

-- Kartu kejadian: setiap kartu hanya sekali
create or replace function public.admin_event(p_code text, p_key text, p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions; t record; lossn int;
begin
  s := _admin(p_code, p_key);
  if exists(select 1 from jsonb_array_elements(s.events) e where e->>'k' = p->>'k') then
    raise exception 'Kartu ini sudah dipakai.'; end if;
  lossn := _int(p->>'loss', 0);
  if lossn > 0 then
    for t in select tm.id, tm.qty, tm.loss, coalesce((select sum(units) from sales where team_id = tm.id),0) as sold
             from teams tm where tm.session_id = s.id loop
      update teams set loss = loss + least(lossn, greatest(0, t.qty - t.loss - t.sold)) where id = t.id;
    end loop;
  end if;
  update sessions set
    fx_vc_pct = fx_vc_pct + _int(p->>'vcPct', 0),
    fx_fc_add = fx_fc_add + _int(p->>'fcAdd', 0),
    bundle = case when (p->>'bundle') = 'true' then true else bundle end,
    events = events || jsonb_build_array(jsonb_build_object('k', p->>'k', 't', p->>'t', 'i', p->>'i')),
    updated_at = now()
  where id = s.id;
  return json_build_object('ok', true);
end $$;

-- Koreksi data tim oleh fasilitator (mis. salah ketik produksi sebelum pasar dibuka)
create or replace function public.admin_team(p_code text, p_key text, p_team uuid, p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions;
begin
  s := _admin(p_code, p_key);
  update teams set
    name = left(coalesce(p->>'name', name), 60),
    product = left(coalesce(p->>'product', product), 80),
    price = greatest(0, _int(p->>'price', price)),
    vc = greatest(0, _int(p->>'vc', vc)),
    fc = greatest(0, _int(p->>'fc', fc)),
    qty = greatest(0, least(1000, _int(p->>'qty', qty))),
    round = greatest(1, least(s.round_count, _int(p->>'round', round))),
    updated_at = now()
  where id = p_team and session_id = s.id;
  return json_build_object('ok', true);
end $$;

create or replace function public.admin_undo_sale(p_code text, p_key text, p_sale bigint) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions;
begin
  s := _admin(p_code, p_key);
  delete from sales where id = p_sale and session_id = s.id;
  return json_build_object('ok', true);
end $$;

create or replace function public.admin_kick(p_code text, p_key text, p_player uuid) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions;
begin
  s := _admin(p_code, p_key);
  delete from players where id = p_player and session_id = s.id;
  return json_build_object('ok', true);
end $$;

-- Ulangi pasar: data tim tetap, penjualan dan kartu dihapus, kunci dibuka
create or replace function public.admin_reset_market(p_code text, p_key text) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions;
begin
  s := _admin(p_code, p_key);
  delete from sales where session_id = s.id;
  update teams set loss = 0, bundle_price = 0, price = coalesce((plan->>'price')::int, price), plan = null where session_id = s.id;
  update sessions set status = 'setup', round = 0, phase = 'idle', fx_vc_pct = 0, fx_fc_add = 0, bundle = false,
    events = '[]'::jsonb, updated_at = now() where id = s.id;
  return json_build_object('ok', true);
end $$;

-- ---------- pemain ----------
create or replace function public.join_session(p_code text, p_name text, p_team int, p_rep boolean) returns json
language plpgsql security definer set search_path = public as $$
declare s sessions; p players; t text;
begin
  select * into s from sessions where code = upper(trim(p_code));
  if not found then raise exception 'Kode sesi tidak ditemukan. Periksa lagi kodenya.'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'Isi nama Anda dulu.'; end if;
  if p_team is null or p_team < 1 or p_team > s.team_count then
    raise exception 'Nomor tim harus antara 1 sampai %.', s.team_count; end if;
  if p_rep and exists(select 1 from players where session_id = s.id and team_number = p_team and is_rep) then
    raise exception 'Tim % sudah punya perwakilan. Gabung sebagai pembeli.', p_team; end if;
  insert into players(session_id, name, team_number, is_rep)
  values (s.id, left(trim(p_name), 40), p_team, coalesce(p_rep, false)) returning * into p;
  t := _token();
  insert into player_keys values (p.id, t);
  return json_build_object('player_id', p.id, 'token', t, 'session_id', s.id, 'code', s.code,
                           'team', p_team, 'is_rep', p.is_rep, 'name', p.name);
exception when unique_violation then
  raise exception 'Tim % sudah punya perwakilan. Gabung sebagai pembeli.', p_team;
end $$;

-- Keadaan lengkap untuk HP pemain (dipanggil berkala)
create or replace function public.player_state(p_token text) returns json
language plpgsql stable security definer set search_path = public as $$
declare me players; s sessions; spent int;
begin
  me := _me(p_token);
  select * into s from sessions where id = me.session_id;
  select coalesce(sum(amount),0) into spent from sales where buyer_id = me.id and round = s.round;
  return json_build_object(
    'me', json_build_object('id', me.id, 'name', me.name, 'team', me.team_number, 'is_rep', me.is_rep),
    'session', json_build_object('id', s.id, 'code', s.code, 'name', s.name, 'status', s.status, 'round', s.round,
      'phase', s.phase, 'round_count', s.round_count, 'team_count', s.team_count, 'budget', s.budget,
      'max_per_team', s.max_per_team, 'bundle', s.bundle, 'events', s.events,
      'fx_vc_pct', s.fx_vc_pct, 'fx_fc_add', s.fx_fc_add),
    'spent', spent,
    'bought', (select coalesce(json_agg(json_build_object('team_id', team_id, 'units', units, 'amount', amount, 'round', round)), '[]'::json)
               from sales where buyer_id = me.id),
    'teams', (select coalesce(json_agg(x order by x.number), '[]'::json) from (
        select t.id, t.number, t.name, t.product, t.unit, t.tagline, t.uniques, t.price, t.bundle_price, t.round,
               t.qty, t.loss,
               coalesce((select sum(units) from sales where team_id = t.id),0) as sold,
               coalesce((select sum(amount) from sales where team_id = t.id),0) as revenue
        from teams t where t.session_id = s.id) x)
  );
end $$;

-- Perwakilan tim menyimpan Lembar Usaha Tim. Setelah pasar dibuka, produksi dan biaya terkunci.
create or replace function public.rep_save(p_token text, p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare me players; s sessions;
begin
  me := _me(p_token);
  if not me.is_rep then raise exception 'Hanya perwakilan tim yang bisa mengubah data tim.'; end if;
  select * into s from sessions where id = me.session_id;
  update teams set
    name = left(coalesce(p->>'name', name), 60),
    members = left(coalesce(p->>'members', members), 200),
    product = left(coalesce(p->>'product', product), 80),
    unit = left(coalesce(nullif(p->>'unit',''), unit), 20),
    tagline = left(coalesce(p->>'tagline', tagline), 160),
    uniques = left(coalesce(p->>'uniques', uniques), 400),
    price = greatest(0, _int(p->>'price', price)),
    bundle_price = greatest(0, _int(p->>'bundle_price', bundle_price)),
    vc = case when s.status = 'setup' then greatest(0, _int(p->>'vc', vc)) else vc end,
    fc = case when s.status = 'setup' then greatest(0, _int(p->>'fc', fc)) else fc end,
    qty = case when s.status = 'setup' then greatest(0, least(1000, _int(p->>'qty', qty))) else qty end,
    updated_at = now()
  where session_id = s.id and number = me.team_number;
  return json_build_object('ok', true, 'locked', s.status <> 'setup');
end $$;

-- Beli: semua aturan dicek di sini, dalam satu transaksi
create or replace function public.buy(p_token text, p_team uuid, p_bundle boolean default false) returns json
language plpgsql security definer set search_path = public as $$
declare me players; s sessions; t teams; spent int; sold int; cnt int; u int; amt int;
begin
  me := _me(p_token);
  perform 1 from players where id = me.id for update;                 -- satu pembeli, satu transaksi pada satu waktu
  select * into s from sessions where id = me.session_id;
  if s.status <> 'market' or s.phase <> 'buy' then raise exception 'Belanja belum dibuka.'; end if;
  select * into t from teams where id = p_team and session_id = s.id for update;   -- stok tim terkunci selama dicek
  if not found then raise exception 'Tim tidak ditemukan.'; end if;
  if t.round <> s.round then raise exception 'Tim ini tidak berjualan di ronde ini.'; end if;
  if t.number = me.team_number then raise exception 'Tidak boleh membeli produk tim sendiri.'; end if;
  if exists(select 1 from teams where session_id = s.id and number = me.team_number and round = s.round) then
    raise exception 'Tim Anda sedang berjualan di ronde ini. Jaga lapak dulu.'; end if;
  select count(*) into cnt from sales where buyer_id = me.id and team_id = t.id;
  if cnt >= s.max_per_team then raise exception 'Anda sudah membeli dari tim ini.'; end if;
  if coalesce(p_bundle, false) then
    if not s.bundle or t.bundle_price <= 0 then raise exception 'Paket tidak tersedia di tim ini.'; end if;
    u := 2; amt := t.bundle_price;
  else
    if t.price <= 0 then raise exception 'Tim ini belum menetapkan harga.'; end if;
    u := 1; amt := t.price;
  end if;
  select coalesce(sum(units),0) into sold from sales where team_id = t.id;
  if t.qty - t.loss - sold < u then raise exception 'Stok tim ini sudah habis.'; end if;
  select coalesce(sum(amount),0) into spent from sales where buyer_id = me.id and round = s.round;
  if spent + amt > s.budget then raise exception 'Uang virtual Anda di ronde ini tidak cukup.'; end if;
  insert into sales(session_id, team_id, buyer_id, round, units, amount, is_bundle)
  values (s.id, t.id, me.id, s.round, u, amt, coalesce(p_bundle, false));
  return player_state(p_token);
end $$;

-- ---------- izin menjalankan fungsi ----------
revoke all on function public._me(text), public._admin(text,text), public._token(), public._code(), public._int(text,int) from public, anon, authenticated;
grant execute on function
  public.create_session(text,int,int,int), public.admin_check(text,text), public.admin_update(text,text,jsonb),
  public.admin_open_market(text,text), public.admin_event(text,text,jsonb), public.admin_team(text,text,uuid,jsonb),
  public.admin_undo_sale(text,text,bigint), public.admin_kick(text,text,uuid), public.admin_reset_market(text,text),
  public.join_session(text,text,int,boolean), public.player_state(text), public.rep_save(text,jsonb), public.buy(text,uuid,boolean)
to anon, authenticated;

-- ---------- realtime untuk papan pasar ----------
do $$ begin
  begin alter publication supabase_realtime add table public.sessions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.teams; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sales; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.players; exception when duplicate_object then null; end;
end $$;
