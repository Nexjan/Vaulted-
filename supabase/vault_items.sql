-- Run this once in your Supabase dashboard → SQL Editor

create table if not exists vault_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  listing_id  text not null,
  created_at  timestamptz not null default now(),
  constraint vault_items_user_listing_unique unique (user_id, listing_id)
);

-- Enable Row Level Security
alter table vault_items enable row level security;

-- Users can only read their own rows
create policy "vault_select_own"
  on vault_items for select
  using (auth.uid() = user_id);

-- Users can only insert rows for themselves
create policy "vault_insert_own"
  on vault_items for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own rows
create policy "vault_delete_own"
  on vault_items for delete
  using (auth.uid() = user_id);
