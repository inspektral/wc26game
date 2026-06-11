-- ============================================================================
-- WC26 prediction game — Supabase / Postgres schema
-- Run this in the Supabase SQL editor (Database -> SQL editor -> New query).
-- Safe to re-run: it drops & recreates policies/functions.
-- ============================================================================

-- ---------- tables ----------------------------------------------------------

create table if not exists profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

create table if not exists matches (
  id            bigint generated always as identity primary key,
  external_id   bigint unique not null,          -- football-data.org match id
  home_team     text not null,
  away_team     text not null,
  home_code     text,                             -- 3-letter team code (TLA)
  away_code     text,
  home_crest    text,                             -- crest image url
  away_crest    text,
  kickoff       timestamptz not null,
  stage         text,                             -- GROUP_STAGE, ROUND_OF_16, ...
  group_name    text,                             -- "Group A" etc (null in knockouts)
  status        text not null default 'SCHEDULED',-- SCHEDULED|TIMED|IN_PLAY|PAUSED|FINISHED|...
  home_score    int,
  away_score    int,
  updated_at    timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on matches (kickoff);

create table if not exists predictions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references profiles (id) on delete cascade,
  match_id    bigint not null references matches (id) on delete cascade,
  home_score  int not null check (home_score >= 0 and home_score <= 30),
  away_score  int not null check (away_score >= 0 and away_score <= 30),
  points      int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists predictions_match_idx on predictions (match_id);
create index if not exists predictions_user_idx on predictions (user_id);

-- ---------- new-user trigger: auto-create a profile ------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- scoring ---------------------------------------------------------
-- 3 pts: exact score | 2 pts: correct (signed) goal difference
-- 1 pt: correct winner/draw outcome | 0 otherwise. Highest tier wins.

create or replace function recompute_points()
returns void
language sql
security definer set search_path = public
as $$
  update predictions p
  set points = case
      when m.home_score is null or m.away_score is null then 0
      when p.home_score = m.home_score and p.away_score = m.away_score then 3
      when (p.home_score - p.away_score) = (m.home_score - m.away_score) then 2
      when sign(p.home_score - p.away_score) = sign(m.home_score - m.away_score) then 1
      else 0
    end
  from matches m
  where p.match_id = m.id;
$$;

-- ---------- leaderboard view -----------------------------------------------
-- Aggregated totals are public to all signed-in users (no per-pick leak here).

create or replace view leaderboard
with (security_invoker = off) as
select
  pr.id,
  pr.display_name,
  coalesce(sum(p.points), 0)                              as total_points,
  count(p.id) filter (where p.points = 3)                 as exact_hits,
  count(p.id) filter (where p.points = 2)                 as diff_hits,
  count(p.id) filter (where p.points = 1)                 as winner_hits,
  count(p.id) filter (where m.status = 'FINISHED')        as scored_matches,
  count(p.id)                                             as predictions_made
from profiles pr
left join predictions p on p.user_id = pr.id
left join matches m on m.id = p.match_id
group by pr.id, pr.display_name;

-- ---------- group prediction stats per match (post-kickoff only) -----------
-- A security-definer function so it can aggregate everyone's picks without
-- exposing individual rows before kickoff.

create or replace function match_prediction_stats(p_match_id bigint)
returns table (
  total          bigint,
  avg_home       numeric,
  avg_away       numeric,
  home_win_pct   numeric,
  draw_pct       numeric,
  away_win_pct   numeric,
  top_score      text,
  top_score_pct  numeric
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_kickoff timestamptz;
begin
  select kickoff into v_kickoff from matches where id = p_match_id;
  -- Only reveal aggregates once the match has kicked off.
  if v_kickoff is null or v_kickoff > now() then
    return;
  end if;

  return query
  with picks as (
    select home_score h, away_score a from predictions where match_id = p_match_id
  ),
  agg as (
    select
      count(*)::bigint                                              as total,
      round(avg(h), 2)                                             as avg_home,
      round(avg(a), 2)                                             as avg_away,
      round(100.0 * count(*) filter (where h > a) / nullif(count(*),0), 0) as home_win_pct,
      round(100.0 * count(*) filter (where h = a) / nullif(count(*),0), 0) as draw_pct,
      round(100.0 * count(*) filter (where h < a) / nullif(count(*),0), 0) as away_win_pct
    from picks
  ),
  top as (
    select (h || '-' || a) as score, count(*) c
    from picks group by h, a order by c desc, score limit 1
  )
  select a.total, a.avg_home, a.avg_away, a.home_win_pct, a.draw_pct, a.away_win_pct,
         t.score,
         round(100.0 * t.c / nullif(a.total,0), 0)
  from agg a left join top t on true;
end;
$$;

-- ---------- row-level security ---------------------------------------------

alter table profiles    enable row level security;
alter table matches     enable row level security;
alter table predictions enable row level security;

-- profiles: anyone signed-in can read; you can edit your own row.
drop policy if exists "profiles_read"   on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_read"   on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- matches: read-only to clients. Writes happen via service role (sync), which
-- bypasses RLS, so no insert/update policy is granted.
drop policy if exists "matches_read" on matches;
create policy "matches_read" on matches for select to authenticated using (true);

-- predictions:
--  read  -> your own anytime; others' only after that match has kicked off
--  write -> only your own, and only while the match has NOT kicked off
drop policy if exists "predictions_read"   on predictions;
drop policy if exists "predictions_insert" on predictions;
drop policy if exists "predictions_update" on predictions;

create policy "predictions_read" on predictions for select to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from matches m where m.id = predictions.match_id and m.kickoff <= now())
);

create policy "predictions_insert" on predictions for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from matches m where m.id = match_id and m.kickoff > now())
);

create policy "predictions_update" on predictions for update to authenticated
using (
  user_id = auth.uid()
  and exists (select 1 from matches m where m.id = match_id and m.kickoff > now())
)
with check (
  user_id = auth.uid()
  and exists (select 1 from matches m where m.id = match_id and m.kickoff > now())
);

-- allow signed-in users to call the stats helper & read the view
grant select on leaderboard to authenticated;
grant execute on function match_prediction_stats(bigint) to authenticated;
