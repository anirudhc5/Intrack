-- =============================================================================
-- Intrack — current-state schema snapshot (public schema)
-- =============================================================================
-- Flattened from: supabase/migrations/20260913222025_remote_schema.sql
--                 (the only migration; pulled from the live project via
--                 `supabase db pull` on 2026-09-13)
--
-- supabase/migrations/ is the append-only history. This file is the
-- quick-reference view. When a new migration lands, regenerate this file.
--
-- Omitted as dump noise: SET statements, OWNER TO, default-privilege
-- boilerplate. Grants are Supabase defaults: GRANT ALL on every table and
-- function to anon / authenticated / service_role (RLS is what actually
-- restricts access).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"           with schema "extensions";
create extension if not exists "uuid-ossp"          with schema "extensions";
create extension if not exists "pg_stat_statements" with schema "extensions";
create extension if not exists "supabase_vault"     with schema "vault";
-- pg_net: dropped (`drop extension if exists "pg_net"` at end of migration)


-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Trigger fn: bumps updated_at on row update (used by applications).
create or replace function public.set_updated_at() returns trigger
    language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Event-trigger fn: auto-enables RLS on any new table created in `public`.
-- NOTE: the pulled dump contains no CREATE EVENT TRIGGER attaching this
-- function. Whether it is actually wired up is unverified (see STATUS.md).
create or replace function public.rls_auto_enable() returns event_trigger
    language plpgsql security definer
    set search_path to 'pg_catalog'
as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
     if cmd.schema_name is not null and cmd.schema_name in ('public') and cmd.schema_name not in ('pg_catalog','information_schema') and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
     else
        raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     end if;
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- postings — discovered internship postings, shared across users (15 columns)
create table public.postings (
    id              uuid        not null default gen_random_uuid(),
    source          text        not null,
    external_id     text        not null,
    canonical_id    text        not null,
    title           text        not null,
    company         text        not null,
    categories      text[]      not null,                       -- no default; no DB constraint on values
    location        text,
    jd_text         text,
    url             text        not null,
    salary_text     text,
    posted_at       timestamptz,
    first_seen_at   timestamptz          default now(),         -- nullable (no NOT NULL)
    raw             jsonb,
    is_active       boolean     not null default true,
    -- NOTE: no updated_at column

    constraint postings_pkey primary key (id),
    constraint postings_canonical_id_key unique (canonical_id)
);

-- applications — one row per user-tracked application (17 columns)
create table public.applications (
    id              uuid        not null default gen_random_uuid(),
    user_id         uuid        not null,
    posting_id      uuid,
    title           text        not null,
    company         text        not null,
    jd_text         text,
    location        text,
    url             text,
    salary_text     text,
    status          text        not null default 'saved',
    status_history  jsonb       not null default '[]'::jsonb,   -- array of {status, status_detail, changed_at}; shape enforced in code only
    notes           text,
    applied_at      timestamptz,
    created_at      timestamptz          default now(),         -- nullable (no NOT NULL)
    updated_at      timestamptz          default now(),         -- nullable (no NOT NULL); maintained by trigger
    categories      text[]      not null default '{}',          -- no DB constraint on values; taxonomy enforced in code
    status_detail   text,

    constraint applications_pkey primary key (id),
    constraint applications_user_id_fkey    foreign key (user_id)    references auth.users(id),
    constraint applications_posting_id_fkey foreign key (posting_id) references public.postings(id),
    constraint applications_status_check check (status = any (array[
        'saved',
        'applied',
        'oa',
        'interview_1',
        'interview_2',
        'interview_3+',
        'offer',
        'accepted',
        'rejected',
        'withdrawn'
    ]))
);

-- user_preferences — one row per user; user_id IS the primary key (5 columns)
create table public.user_preferences (
    user_id              uuid     not null,
    categories           text[]   not null default '{}',
    notify_email         boolean           default true,        -- nullable (no NOT NULL)
    weekly_goal          integer  not null default 6,
    notification_emails  text[]   not null default '{}',
    -- NOTE: no id, min_salary, created_at, or updated_at columns

    constraint user_preferences_pkey primary key (user_id),
    constraint user_preferences_user_id_fkey foreign key (user_id) references auth.users(id)
);


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_applications_user_id on public.applications using btree (user_id);
create index idx_postings_categories  on public.postings     using gin   (categories);
create index idx_postings_is_active   on public.postings     using btree (is_active) where (is_active = true);
create index idx_postings_posted_at   on public.postings     using btree (posted_at desc);


-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace trigger trg_applications_updated_at
    before update on public.applications
    for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.applications     enable row level security;
alter table public.postings         enable row level security;
alter table public.user_preferences enable row level security;

-- postings: read-only for everyone (no insert/update/delete policy → writes denied except service_role)
create policy "Anyone can read postings" on public.postings
    for select using (true);

-- applications: full CRUD scoped to owner
create policy "Users can CRUD own applications" on public.applications
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- user_preferences: full CRUD scoped to owner
create policy "Users can CRUD own preferences" on public.user_preferences
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
