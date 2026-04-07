create extension if not exists "pgcrypto";

do $$
begin
  create type public.campaign_status as enum ('active', 'paused', 'finished', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.quest_status as enum ('active', 'investigating', 'completed', 'paused', 'failed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.knowledge_kind as enum ('private', 'group', 'rumor', 'fact');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.journal_entry_type as enum ('note', 'recap', 'theory', 'rumor', 'loot', 'npc', 'location');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.creature_usage_kind as enum ('wildshape', 'companion', 'pet', 'mount', 'ally');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text not null default 'Adventurer',
  avatar_url text,
  preferred_locale text not null default 'es-AR',
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  slug text unique,
  status public.campaign_status not null default 'active',
  setting text,
  summary text,
  focus text,
  next_move text,
  last_session_label text,
  accent text not null default 'from-amber-500/30 via-orange-500/15 to-rose-500/20',
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(setting, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(focus, '') || ' ' ||
      coalesce(next_move, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  name text not null check (length(trim(name)) > 0),
  role_label text,
  tag text,
  summary text,
  is_pinned boolean not null default false,
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(role_label, '') || ' ' ||
      coalesce(tag, '') || ' ' ||
      coalesce(summary, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  title text not null check (length(trim(title)) > 0),
  status public.quest_status not null default 'active',
  detail text,
  priority smallint not null default 0 check (priority between 0 and 5),
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(detail, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  title text not null check (length(trim(title)) > 0),
  location_type text,
  detail text,
  is_safe_haven boolean not null default false,
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(location_type, '') || ' ' ||
      coalesce(detail, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  title text not null check (length(trim(title)) > 0),
  body text,
  kind public.knowledge_kind not null default 'group',
  visibility text not null default 'campaign' check (visibility in ('campaign', 'private')),
  owner_user_id uuid references public.profiles (id),
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(body, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint private_knowledge_requires_owner
    check (visibility = 'campaign' or owner_user_id is not null)
);

create table if not exists public.session_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  session_number integer,
  title text not null check (length(trim(title)) > 0),
  recap text,
  played_on date,
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(recap, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  name text not null check (length(trim(name)) > 0),
  item_type text,
  holder text,
  quantity numeric(10, 2) not null default 1,
  notes text,
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(item_type, '') || ' ' ||
      coalesce(holder, '') || ' ' ||
      coalesce(notes, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  session_log_id uuid references public.session_logs (id) on delete set null,
  authored_by uuid not null references public.profiles (id) default auth.uid(),
  updated_by uuid references public.profiles (id),
  title text,
  body text not null,
  entry_type public.journal_entry_type not null default 'note',
  is_pinned boolean not null default false,
  sort_order integer not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(body, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saved_creatures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  usage_kind public.creature_usage_kind not null default 'companion',
  source_system text not null default 'srd_2014',
  source_index text not null,
  name text not null check (length(trim(name)) > 0),
  creature_type text,
  size text,
  challenge_value numeric(5, 3),
  challenge_label text,
  armor_class integer,
  hit_points integer,
  hit_dice text,
  speed text,
  alignment text,
  image_url text,
  source_url text,
  snippet text,
  traits jsonb not null default '[]'::jsonb,
  notes text,
  is_favorite boolean not null default true,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(creature_type, '') || ' ' ||
      coalesce(size, '') || ' ' ||
      coalesce(snippet, '') || ' ' ||
      coalesce(notes, '')
    )
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint saved_creatures_source_unique
    unique (campaign_id, user_id, usage_kind, source_system, source_index)
);

create index if not exists campaigns_owner_user_id_idx on public.campaigns (owner_user_id);
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_search_tsv_idx on public.campaigns using gin (search_tsv);

create index if not exists characters_campaign_id_idx on public.characters (campaign_id, sort_order);
create index if not exists characters_search_tsv_idx on public.characters using gin (search_tsv);

create index if not exists quests_campaign_id_idx on public.quests (campaign_id, status, sort_order);
create index if not exists quests_search_tsv_idx on public.quests using gin (search_tsv);

create index if not exists locations_campaign_id_idx on public.locations (campaign_id, sort_order);
create index if not exists locations_search_tsv_idx on public.locations using gin (search_tsv);

create index if not exists knowledge_entries_campaign_id_idx on public.knowledge_entries (campaign_id, kind, sort_order);
create index if not exists knowledge_entries_search_tsv_idx on public.knowledge_entries using gin (search_tsv);

create index if not exists session_logs_campaign_id_idx on public.session_logs (campaign_id, played_on desc, sort_order);
create index if not exists session_logs_search_tsv_idx on public.session_logs using gin (search_tsv);

create index if not exists inventory_items_campaign_id_idx on public.inventory_items (campaign_id, sort_order);
create index if not exists inventory_items_search_tsv_idx on public.inventory_items using gin (search_tsv);

create index if not exists journal_entries_campaign_id_idx on public.journal_entries (campaign_id, created_at desc);
create index if not exists journal_entries_session_log_id_idx on public.journal_entries (session_log_id);
create index if not exists journal_entries_search_tsv_idx on public.journal_entries using gin (search_tsv);

create index if not exists saved_creatures_campaign_id_idx on public.saved_creatures (campaign_id, usage_kind, user_id);
create index if not exists saved_creatures_search_tsv_idx on public.saved_creatures using gin (search_tsv);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
before update on public.campaigns
for each row execute procedure public.touch_updated_at();

drop trigger if exists characters_touch_updated_at on public.characters;
create trigger characters_touch_updated_at
before update on public.characters
for each row execute procedure public.touch_updated_at();

drop trigger if exists quests_touch_updated_at on public.quests;
create trigger quests_touch_updated_at
before update on public.quests
for each row execute procedure public.touch_updated_at();

drop trigger if exists locations_touch_updated_at on public.locations;
create trigger locations_touch_updated_at
before update on public.locations
for each row execute procedure public.touch_updated_at();

drop trigger if exists knowledge_entries_touch_updated_at on public.knowledge_entries;
create trigger knowledge_entries_touch_updated_at
before update on public.knowledge_entries
for each row execute procedure public.touch_updated_at();

drop trigger if exists session_logs_touch_updated_at on public.session_logs;
create trigger session_logs_touch_updated_at
before update on public.session_logs
for each row execute procedure public.touch_updated_at();

drop trigger if exists inventory_items_touch_updated_at on public.inventory_items;
create trigger inventory_items_touch_updated_at
before update on public.inventory_items
for each row execute procedure public.touch_updated_at();

drop trigger if exists journal_entries_touch_updated_at on public.journal_entries;
create trigger journal_entries_touch_updated_at
before update on public.journal_entries
for each row execute procedure public.touch_updated_at();

drop trigger if exists saved_creatures_touch_updated_at on public.saved_creatures;
create trigger saved_creatures_touch_updated_at
before update on public.saved_creatures
for each row execute procedure public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), 'Adventurer')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(coalesce(u.email, ''), '@', 1), 'Adventurer')
from auth.users u
on conflict (id) do nothing;

create or replace function public.owns_campaign(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = target_campaign_id
      and c.owner_user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.characters enable row level security;
alter table public.quests enable row level security;
alter table public.locations enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.session_logs enable row level security;
alter table public.inventory_items enable row level security;
alter table public.journal_entries enable row level security;
alter table public.saved_creatures enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "campaigns_select_owner" on public.campaigns;
create policy "campaigns_select_owner"
on public.campaigns
for select
using (owner_user_id = auth.uid());

drop policy if exists "campaigns_insert_owner" on public.campaigns;
create policy "campaigns_insert_owner"
on public.campaigns
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "campaigns_update_owner" on public.campaigns;
create policy "campaigns_update_owner"
on public.campaigns
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "campaigns_delete_owner" on public.campaigns;
create policy "campaigns_delete_owner"
on public.campaigns
for delete
using (owner_user_id = auth.uid());

drop policy if exists "characters_select_owner" on public.characters;
create policy "characters_select_owner"
on public.characters
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "characters_insert_owner" on public.characters;
create policy "characters_insert_owner"
on public.characters
for insert
with check (public.owns_campaign(campaign_id));

drop policy if exists "characters_update_owner" on public.characters;
create policy "characters_update_owner"
on public.characters
for update
using (public.owns_campaign(campaign_id))
with check (public.owns_campaign(campaign_id));

drop policy if exists "characters_delete_owner" on public.characters;
create policy "characters_delete_owner"
on public.characters
for delete
using (public.owns_campaign(campaign_id));

drop policy if exists "quests_select_owner" on public.quests;
create policy "quests_select_owner"
on public.quests
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "quests_insert_owner" on public.quests;
create policy "quests_insert_owner"
on public.quests
for insert
with check (public.owns_campaign(campaign_id));

drop policy if exists "quests_update_owner" on public.quests;
create policy "quests_update_owner"
on public.quests
for update
using (public.owns_campaign(campaign_id))
with check (public.owns_campaign(campaign_id));

drop policy if exists "quests_delete_owner" on public.quests;
create policy "quests_delete_owner"
on public.quests
for delete
using (public.owns_campaign(campaign_id));

drop policy if exists "locations_select_owner" on public.locations;
create policy "locations_select_owner"
on public.locations
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "locations_insert_owner" on public.locations;
create policy "locations_insert_owner"
on public.locations
for insert
with check (public.owns_campaign(campaign_id));

drop policy if exists "locations_update_owner" on public.locations;
create policy "locations_update_owner"
on public.locations
for update
using (public.owns_campaign(campaign_id))
with check (public.owns_campaign(campaign_id));

drop policy if exists "locations_delete_owner" on public.locations;
create policy "locations_delete_owner"
on public.locations
for delete
using (public.owns_campaign(campaign_id));

drop policy if exists "knowledge_entries_select_owner" on public.knowledge_entries;
create policy "knowledge_entries_select_owner"
on public.knowledge_entries
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "knowledge_entries_insert_owner" on public.knowledge_entries;
create policy "knowledge_entries_insert_owner"
on public.knowledge_entries
for insert
with check (
  public.owns_campaign(campaign_id)
  and (
    visibility = 'campaign'
    or owner_user_id = auth.uid()
  )
);

drop policy if exists "knowledge_entries_update_owner" on public.knowledge_entries;
create policy "knowledge_entries_update_owner"
on public.knowledge_entries
for update
using (public.owns_campaign(campaign_id))
with check (
  public.owns_campaign(campaign_id)
  and (
    visibility = 'campaign'
    or owner_user_id = auth.uid()
  )
);

drop policy if exists "knowledge_entries_delete_owner" on public.knowledge_entries;
create policy "knowledge_entries_delete_owner"
on public.knowledge_entries
for delete
using (public.owns_campaign(campaign_id));

drop policy if exists "session_logs_select_owner" on public.session_logs;
create policy "session_logs_select_owner"
on public.session_logs
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "session_logs_insert_owner" on public.session_logs;
create policy "session_logs_insert_owner"
on public.session_logs
for insert
with check (public.owns_campaign(campaign_id));

drop policy if exists "session_logs_update_owner" on public.session_logs;
create policy "session_logs_update_owner"
on public.session_logs
for update
using (public.owns_campaign(campaign_id))
with check (public.owns_campaign(campaign_id));

drop policy if exists "session_logs_delete_owner" on public.session_logs;
create policy "session_logs_delete_owner"
on public.session_logs
for delete
using (public.owns_campaign(campaign_id));

drop policy if exists "inventory_items_select_owner" on public.inventory_items;
create policy "inventory_items_select_owner"
on public.inventory_items
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "inventory_items_insert_owner" on public.inventory_items;
create policy "inventory_items_insert_owner"
on public.inventory_items
for insert
with check (public.owns_campaign(campaign_id));

drop policy if exists "inventory_items_update_owner" on public.inventory_items;
create policy "inventory_items_update_owner"
on public.inventory_items
for update
using (public.owns_campaign(campaign_id))
with check (public.owns_campaign(campaign_id));

drop policy if exists "inventory_items_delete_owner" on public.inventory_items;
create policy "inventory_items_delete_owner"
on public.inventory_items
for delete
using (public.owns_campaign(campaign_id));

drop policy if exists "journal_entries_select_owner" on public.journal_entries;
create policy "journal_entries_select_owner"
on public.journal_entries
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "journal_entries_insert_owner" on public.journal_entries;
create policy "journal_entries_insert_owner"
on public.journal_entries
for insert
with check (
  public.owns_campaign(campaign_id)
  and authored_by = auth.uid()
);

drop policy if exists "journal_entries_update_owner" on public.journal_entries;
create policy "journal_entries_update_owner"
on public.journal_entries
for update
using (
  public.owns_campaign(campaign_id)
  and authored_by = auth.uid()
)
with check (
  public.owns_campaign(campaign_id)
  and authored_by = auth.uid()
);

drop policy if exists "journal_entries_delete_owner" on public.journal_entries;
create policy "journal_entries_delete_owner"
on public.journal_entries
for delete
using (
  public.owns_campaign(campaign_id)
  and authored_by = auth.uid()
);

drop policy if exists "saved_creatures_select_owner" on public.saved_creatures;
create policy "saved_creatures_select_owner"
on public.saved_creatures
for select
using (public.owns_campaign(campaign_id));

drop policy if exists "saved_creatures_insert_owner" on public.saved_creatures;
create policy "saved_creatures_insert_owner"
on public.saved_creatures
for insert
with check (
  public.owns_campaign(campaign_id)
  and user_id = auth.uid()
);

drop policy if exists "saved_creatures_update_owner" on public.saved_creatures;
create policy "saved_creatures_update_owner"
on public.saved_creatures
for update
using (
  public.owns_campaign(campaign_id)
  and user_id = auth.uid()
)
with check (
  public.owns_campaign(campaign_id)
  and user_id = auth.uid()
);

drop policy if exists "saved_creatures_delete_owner" on public.saved_creatures;
create policy "saved_creatures_delete_owner"
on public.saved_creatures
for delete
using (
  public.owns_campaign(campaign_id)
  and user_id = auth.uid()
);
