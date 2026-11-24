-- MORANOSAURUS LIVE: trim the live roster to the three requested dinosaurs.
-- Safe to apply after the original initial_schema migration on an existing Supabase project.
begin;

-- Remove old inventory references before deleting their catalog rows.
delete from public.player_cards pc
 using public.card_catalog cc
 where pc.card_id = cc.id
   and cc.character_id not in ('mora', 'hwarok', 'alpi');

insert into public.card_catalog (id, rarity, character_id, name) values
  ('mora_4_spark',4,'mora','말풍선 폭죽!'),
  ('hwarok_4_core',4,'hwarok','심장 속 화산핵'),
  ('alpi_4_silence',4,'alpi','고요의 주파수'),
  ('mora_3_misdirection',3,'mora','말풍선 미아 사건'),
  ('hwarok_3_heartbeat',3,'hwarok','화산 심박 카운트'),
  ('alpi_3_moonrain',3,'alpi','달빛 아래 빗소리'),
  ('mora_2_sticker',2,'mora','스티커 대소동'),
  ('hwarok_2_drill',2,'hwarok','드럼은 정직해'),
  ('alpi_1_rain',1,'alpi','창가의 빗방울')
on conflict (id) do update
set rarity = excluded.rarity, character_id = excluded.character_id, name = excluded.name;

delete from public.card_catalog
 where character_id not in ('mora', 'hwarok', 'alpi');

-- Update the signup trigger so newly registered users receive three cards from this roster.
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

  insert into public.player_cards(user_id, card_id, quantity, level)
  values
    (new.id, 'mora_2_sticker', 1, 1),
    (new.id, 'hwarok_2_drill', 1, 1),
    (new.id, 'alpi_1_rain', 1, 1)
  on conflict (user_id, card_id) do nothing;
  return new;
end;
$$;

-- Grant the same starting collection to existing accounts, without duplicating cards.
insert into public.player_cards(user_id, card_id, quantity, level)
select u.id, seed.card_id, 1, 1
from auth.users u
cross join (values ('mora_2_sticker'), ('hwarok_2_drill'), ('alpi_1_rain')) as seed(card_id)
on conflict (user_id, card_id) do nothing;

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
  v_featured := case p_banner when 'pickup' then 'mora_4_spark' when 'event' then 'alpi_4_silence' else null end;

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
       where rarity = v_rarity and character_id in ('mora', 'hwarok', 'alpi')
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

revoke all on function public.draw_gacha(text, integer) from public;
grant execute on function public.draw_gacha(text, integer) to authenticated;

commit;
