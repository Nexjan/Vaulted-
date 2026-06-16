-- Allows an authenticated user to delete their own auth record.
-- Run this once in the Supabase SQL editor.
--
-- Usage: called automatically by the Account screen "Delete Account" flow.

create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function delete_user() to authenticated;
