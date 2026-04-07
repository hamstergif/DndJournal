alter table if exists public.characters
  add column if not exists class_name text,
  add column if not exists level integer,
  add column if not exists race text,
  add column if not exists armor_class integer,
  add column if not exists hit_points integer,
  add column if not exists speed text,
  add column if not exists passive_perception integer,
  add column if not exists sheet_reference_url text;

alter table if exists public.knowledge_entries
  add column if not exists known_by text;
