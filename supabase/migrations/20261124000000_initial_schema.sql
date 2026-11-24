-- 뭐라노사우르스 LIVE · first Supabase schema
-- Apply with: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '새싹 라이더',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_wallet (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gems integer not null default 6000 check (gems >= 0),
  shards integer not null default 0 check (shards >= 0),
  pity integer not null default 0 check (pity between 0 and 99),
  exchange_points integer not null default 0 check (exchange_points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_catalog (
  id text primary key,
  rarity smallint not null check (rarity between 1 and 4),
  character_id text not null,
  name text not null
);

create table if not exists public.player_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.card_catalog(id),
  quantity integer not null default 1 check (quantity >= 1),
  level integer not null default 1 check (level between 1 and 10),
  obtained_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.gacha_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  banner text not null check (banner in ('pickup', 'standard', 'event')),
  pulls jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  claim_date date not null default (timezone('utc', now())::date),
  reward integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mission_id, claim_date)
);

create table if not exists public.story_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id text not null,
  reward integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create table if not exists public.live_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id text not null,
  difficulty text not null check (difficulty in ('seed','grow','skilled','rage','transcend','chaos')),
  score integer not null check (score between 0 and 1000000),
  accuracy numeric(6,3) not null check (accuracy between 0 and 100),
  judgements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gacha_history_user_date_idx on public.gacha_history(user_id, created_at desc);
create index if not exists live_records_user_song_idx on public.live_records(user_id, song_id, difficulty, score desc);

insert into public.card_catalog (id, rarity, character_id, name) values
  ('mora_4_spark',4,'mora','말풍선 폭죽!'),
  ('hwarok_4_core',4,'hwarok','심장 속 화산핵'),
  ('alpi_4_silence',4,'alpi','고요의 주파수'),
  ('mailo_4_starlane',4,'mailo','별 사이의 항로'),
  ('lumi_4_prism',4,'lumi','프리즘 스테이지'),
  ('nono_3_formula',3,'nono','정답은 리듬 안에'),
  ('raon_3_radio',3,'raon','새벽 라디오 산책'),
  ('tia_3_solo',3,'tia','불꽃 여섯 줄'),
  ('barak_3_low',3,'barak','둥, 하고 시작'),
  ('musim_3_archive',3,'musim','조용한 컬렉션'),
  ('sio_3_letter',3,'sio','접힌 편지의 온도'),
  ('fern_3_garden',3,'fern','온실의 첫 새싹'),
  ('reef_3_sample',2,'reef','골목 샘플러'),
  ('kulu_2_cloud',2,'kulu','구름 아래 쉼표'),
  ('loop_2_repeat',2,'loop','네 마디의 우연'),
  ('mora_2_sticker',2,'mora','스티커 대소동'),
  ('hwarok_2_drill',2,'hwarok','드럼은 정직해'),
  ('alpi_1_rain',1,'alpi','창가의 빗방울'),
  ('nono_1_keycap',1,'nono','키캡 수집가'),
  ('lumi_1_light',1,'lumi','작은 프리즘')
on conflict (id) do update set rarity = excluded.rarity, character_id = excluded.character_id, name = excluded.name;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(user_id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', '새싹 라이더'))
  on conflict (user_id) do nothing;

  insert into public.player_wallet(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Every new account starts with the same three server-owned cards.
  insert into public.player_cards(user_id, card_id, quantity, level)
  values
    (new.id, 'mora_2_sticker', 1, 1),
    (new.id, 'nono_1_keycap', 1, 1),
    (new.id, 'alpi_1_rain', 1, 1)
  on conflict (user_id, card_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_moranosa on auth.users;
create trigger on_auth_user_created_moranosa
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.player_cards(user_id, card_id, quantity, level)
select u.id, seed.card_id, 1, 1
  from auth.users u
 cross join (values ('mora_2_sticker'), ('nono_1_keycap'), ('alpi_1_rain')) as seed(card_id)
on conflict (user_id, card_id) do nothing;

alter table public.profiles enable row level security;
alter table public.player_saves enable row level security;
alter table public.player_wallet enable row level security;
alter table public.card_catalog enable row level security;
alter table public.player_cards enable row level security;
alter table public.gacha_history enable row level security;
alter table public.mission_claims enable row level security;
alter table public.story_claims enable row level security;
alter table public.live_records enable row level security;

-- Private player data is only visible to its owner.
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "player_saves_select_own" on public.player_saves for select to authenticated using (auth.uid() = user_id);
create policy "player_saves_insert_own" on public.player_saves for insert to authenticated with check (auth.uid() = user_id);
create policy "player_saves_update_own" on public.player_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallet_select_own" on public.player_wallet for select to authenticated using (auth.uid() = user_id);
create policy "catalog_read_all" on public.card_catalog for select to anon, authenticated using (true);
create policy "cards_select_own" on public.player_cards for select to authenticated using (auth.uid() = user_id);
create policy "gacha_history_select_own" on public.gacha_history for select to authenticated using (auth.uid() = user_id);
create policy "mission_claims_select_own" on public.mission_claims for select to authenticated using (auth.uid() = user_id);
create policy "story_claims_select_own" on public.story_claims for select to authenticated using (auth.uid() = user_id);
create policy "live_records_select_own" on public.live_records for select to authenticated using (auth.uid() = user_id);

-- Atomic, server-side pull: wallet deduction, pity counter, duplicate conversion and history
-- are committed in one database transaction. The client cannot UPDATE player_wallet.
create or replace function public.draw_gacha(p_banner text, p_count integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_gems integer;
  v_shards integer;
  v_pity integer;
  v_points integer;
  v_cost integer;
  v_roll integer;
  v_random bytea;
  v_rarity integer;
  v_card_id text;
  v_duplicate boolean;
  v_has_high boolean := false;
  v_pulls jsonb := '[]'::jsonb;
  v_featured text;
  v_i integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_count not in (1, 10) then raise exception 'INVALID_PULL_COUNT'; end if;
  if p_banner not in ('pickup', 'standard', 'event') then raise exception 'INVALID_BANNER'; end if;

  v_cost := case when p_count = 10 then 3000 else 300 end;
  v_featured := case p_banner when 'pickup' then 'mora_4_spark' when 'event' then 'mailo_4_starlane' else null end;

  select gems, shards, pity, exchange_points
    into v_gems, v_shards, v_pity, v_points
    from public.player_wallet
   where user_id = v_user
   for update;

  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if v_gems < v_cost then raise exception 'INSUFFICIENT_GEMS'; end if;
  v_gems := v_gems - v_cost;

  for v_i in 1..p_count loop
    v_random := gen_random_bytes(4);
    v_roll := mod(
      get_byte(v_random, 0)::bigint * 16777216 +
      get_byte(v_random, 1)::bigint * 65536 +
      get_byte(v_random, 2)::bigint * 256 +
      get_byte(v_random, 3)::bigint,
      10000
    )::integer;
    if v_pity >= 99 then
      v_rarity := 4;
    elsif v_roll < 300 then
      v_rarity := 4;
    elsif v_roll < 2000 then
      v_rarity := 3;
    elsif v_roll < 5500 then
      v_rarity := 2;
    else
      v_rarity := 1;
    end if;

    if p_count = 10 and v_i = 10 and not v_has_high and v_rarity < 3 then
      v_rarity := 3;
    end if;

    if v_rarity >= 3 then v_has_high := true; end if;

    if v_rarity = 4 and v_featured is not null and get_byte(gen_random_bytes(1), 0) < 128 then
      v_card_id := v_featured;
    else
      select id into v_card_id
        from public.card_catalog
       where rarity = v_rarity
       order by gen_random_uuid()
       limit 1;
    end if;
    if v_card_id is null then raise exception 'CARD_POOL_EMPTY'; end if;

    select exists(select 1 from public.player_cards where user_id = v_user and card_id = v_card_id)
      into v_duplicate;
    insert into public.player_cards(user_id, card_id, quantity, level)
    values (v_user, v_card_id, 1, 1)
    on conflict (user_id, card_id) do update
      set quantity = public.player_cards.quantity + 1;

    if v_duplicate then v_shards := v_shards + v_rarity * 12; end if;
    v_points := v_points + 1;
    if v_rarity = 4 then v_pity := 0; else v_pity := v_pity + 1; end if;
    v_pulls := v_pulls || jsonb_build_array(jsonb_build_object('cardId', v_card_id, 'rarity', v_rarity, 'duplicate', v_duplicate));
  end loop;

  update public.player_wallet
     set gems = v_gems,
         shards = v_shards,
         pity = v_pity,
         exchange_points = v_points,
         updated_at = now()
   where user_id = v_user;

  insert into public.gacha_history(user_id, banner, pulls) values (v_user, p_banner, v_pulls);
  return jsonb_build_object('pulls', v_pulls, 'gems', v_gems, 'shards', v_shards, 'pity', v_pity, 'exchangePoints', v_points);
end;
$$;

-- Exchange only a 4-star catalog card; cost is charged under the same row lock.
create or replace function public.exchange_featured_card(p_card_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_points integer;
  v_shards integer;
  v_rarity integer;
  v_duplicate boolean;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select rarity into v_rarity from public.card_catalog where id = p_card_id;
  if v_rarity is distinct from 4 then raise exception 'ONLY_FOUR_STAR_CAN_BE_EXCHANGED'; end if;
  select exchange_points, shards into v_points, v_shards from public.player_wallet where user_id = v_user for update;
  if not found or v_points < 200 then raise exception 'NOT_ENOUGH_EXCHANGE_POINTS'; end if;
  select exists(select 1 from public.player_cards where user_id = v_user and card_id = p_card_id) into v_duplicate;
  insert into public.player_cards(user_id, card_id, quantity, level) values (v_user, p_card_id, 1, 1)
  on conflict (user_id, card_id) do update set quantity = public.player_cards.quantity + 1;
  if v_duplicate then v_shards := v_shards + 48; end if;
  v_points := v_points - 200;
  update public.player_wallet set exchange_points = v_points, shards = v_shards, updated_at = now() where user_id = v_user;
  return jsonb_build_object('exchange_points', v_points, 'shards', v_shards);
end;
$$;

-- Server-authoritative card progression: shard deduction and level increment are atomic.
create or replace function public.level_up_card(p_card_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_level integer;
  v_cost integer;
  v_shards integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  -- Lock wallet before inventory, matching the lock order used by gacha/exchange.
  select shards into v_shards
    from public.player_wallet
   where user_id = v_user
   for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;

  select level into v_level
    from public.player_cards
   where user_id = v_user and card_id = p_card_id
   for update;
  if not found then raise exception 'CARD_NOT_OWNED'; end if;
  if v_level >= 10 then raise exception 'CARD_MAX_LEVEL'; end if;

  v_cost := v_level * 10;
  if v_shards < v_cost then raise exception 'NOT_ENOUGH_SHARDS'; end if;

  update public.player_wallet
     set shards = shards - v_cost, updated_at = now()
   where user_id = v_user
   returning shards into v_shards;

  update public.player_cards
     set level = v_level + 1
   where user_id = v_user and card_id = p_card_id;

  return jsonb_build_object('card_id', p_card_id, 'level', v_level + 1, 'shards', v_shards);
end;
$$;

-- A fixed reward table with a per-user/per-day uniqueness constraint prevents duplicate claims.
-- Progress eligibility is checked in the client in this prototype; production deployments should
-- additionally submit and validate signed server-side play results before granting play missions.
create or replace function public.claim_mission_reward(p_mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward integer;
  v_gems integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  v_reward := case p_mission_id when 'play1' then 80 when 'play3' then 140 when 'score' then 100 when 'login' then 50 else null end;
  if v_reward is null then raise exception 'INVALID_MISSION'; end if;
  insert into public.mission_claims(user_id, mission_id, reward)
  values (v_user, p_mission_id, v_reward)
  on conflict (user_id, mission_id, claim_date) do nothing;
  if not found then raise exception 'MISSION_ALREADY_CLAIMED'; end if;
  update public.player_wallet set gems = gems + v_reward, updated_at = now() where user_id = v_user returning gems into v_gems;
  return jsonb_build_object('gems', v_gems, 'reward', v_reward);
end;
$$;

-- Story rewards are paid once per account; album episodes require a matching server run record.
create or replace function public.claim_story_reward(p_story_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward integer;
  v_song_id text;
  v_gems integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  v_reward := case p_story_id
    when 'main_01' then 120
    when 'rage_01' then 100
    when 'alppa_01' then 100
    when 'post_01' then 100
    when 'fern_01' then 100
    else null
  end;
  v_song_id := case p_story_id
    when 'rage_01' then 'rage_01'
    when 'alppa_01' then 'alppa_01'
    when 'post_01' then 'post_01'
    when 'fern_01' then 'fern_01'
    else null
  end;
  if v_reward is null then raise exception 'INVALID_STORY'; end if;

  if v_song_id is not null and not exists (
    select 1 from public.live_records
     where user_id = v_user and song_id = v_song_id
  ) then
    raise exception 'STORY_NOT_UNLOCKED';
  end if;

  insert into public.story_claims(user_id, story_id, reward)
  values (v_user, p_story_id, v_reward)
  on conflict (user_id, story_id) do nothing;
  if not found then raise exception 'STORY_ALREADY_CLAIMED'; end if;

  update public.player_wallet
     set gems = gems + v_reward, updated_at = now()
   where user_id = v_user
   returning gems into v_gems;
  if v_gems is null then raise exception 'WALLET_NOT_FOUND'; end if;
  return jsonb_build_object('gems', v_gems, 'reward', v_reward);
end;
$$;

revoke all on function public.draw_gacha(text, integer) from public;
revoke all on function public.exchange_featured_card(text) from public;
revoke all on function public.claim_mission_reward(text) from public;
revoke all on function public.level_up_card(text) from public;
revoke all on function public.claim_story_reward(text) from public;
grant execute on function public.draw_gacha(text, integer) to authenticated;
grant execute on function public.exchange_featured_card(text) to authenticated;
grant execute on function public.claim_mission_reward(text) to authenticated;
grant execute on function public.level_up_card(text) to authenticated;
grant execute on function public.claim_story_reward(text) to authenticated;

-- Clients can read their own wallet and inventory, but only security-definer RPCs can mutate them.
revoke insert, update, delete on public.player_wallet from anon, authenticated;
revoke insert, update, delete on public.player_cards from anon, authenticated;
revoke insert, update, delete on public.gacha_history from anon, authenticated;

-- Authenticated wallet snapshot used when restoring a cloud save.
create or replace function public.get_player_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select jsonb_build_object('gems', gems, 'shards', shards, 'pity', pity, 'exchange_points', exchange_points)
    into v_result
    from public.player_wallet
   where user_id = v_user;
  if v_result is null then raise exception 'WALLET_NOT_FOUND'; end if;
  return v_result;
end;
$$;

-- Save a completed run and grant its fixed in-game crystal reward on the server.
-- This endpoint checks field bounds and rate-limits submissions, but it does not replay-verify
-- every client input. Do not use client-submitted scores for competitive prize distribution.
create or replace function public.record_live_finish(
  p_song_id text,
  p_difficulty text,
  p_score integer,
  p_accuracy numeric,
  p_judgements jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward integer;
  v_gems integer;
  v_recent_count integer;
  v_song_valid boolean;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_difficulty not in ('seed','grow','skilled','rage','transcend','chaos') then raise exception 'INVALID_DIFFICULTY'; end if;
  if p_score < 0 or p_score > 1000000 or p_accuracy < 0 or p_accuracy > 100 then raise exception 'INVALID_RESULT'; end if;
  select p_song_id in ('mora_01','mora_02','mora_03','rage_01','rage_02','rage_03','alppa_01','alppa_02','alppa_03','post_01','post_02','post_03','fern_01','fern_02','fern_03') into v_song_valid;
  if not v_song_valid then raise exception 'INVALID_SONG'; end if;

  select count(*) into v_recent_count
    from public.live_records
   where user_id = v_user and created_at > now() - interval '20 seconds';
  if v_recent_count > 0 then raise exception 'RESULT_RATE_LIMIT'; end if;

  v_reward := case when p_score > 0 then 15 + floor(p_score / 100000.0)::integer * 5 else 0 end;
  insert into public.live_records(user_id, song_id, difficulty, score, accuracy, judgements)
  values (v_user, p_song_id, p_difficulty, p_score, p_accuracy, coalesce(p_judgements, '{}'::jsonb));
  update public.player_wallet set gems = gems + v_reward, updated_at = now() where user_id = v_user returning gems into v_gems;
  return jsonb_build_object('gems', v_gems, 'reward', v_reward);
end;
$$;

revoke all on function public.get_player_wallet() from public;
revoke all on function public.record_live_finish(text, text, integer, numeric, jsonb) from public;
grant execute on function public.get_player_wallet() to authenticated;
grant execute on function public.record_live_finish(text, text, integer, numeric, jsonb) to authenticated;
