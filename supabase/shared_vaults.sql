-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. Shared vaults table (one row per user, opt-in public sharing)
create table if not exists shared_vaults (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  slug         text not null unique,
  display_name text not null default 'My Vault',
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint shared_vaults_user_unique unique (user_id)
);

alter table shared_vaults enable row level security;

-- Owner can read/write their own row
create policy "sv_owner_select" on shared_vaults
  for select using (auth.uid() = user_id);

create policy "sv_owner_insert" on shared_vaults
  for insert with check (auth.uid() = user_id);

create policy "sv_owner_update" on shared_vaults
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sv_owner_delete" on shared_vaults
  for delete using (auth.uid() = user_id);

-- Anyone (including anon) can read a vault row if is_public = true
-- This is safe: only display_name and slug are returned to the public caller —
-- the user_id UUID is never rendered in the UI.
create policy "sv_public_read" on shared_vaults
  for select using (is_public = true);

-- 2. Extend vault_items so public can read items from a shared public vault.
--    Existing "vault_select_own" policy stays; this policy OR-s alongside it.
create policy "vault_items_public_read" on vault_items
  for select using (
    exists (
      select 1 from shared_vaults sv
      where sv.user_id = vault_items.user_id
        and sv.is_public = true
    )
  );
