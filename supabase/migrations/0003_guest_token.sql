-- Each guest's browser gets a random id (kept in localStorage) so we can
-- enforce "max 50 files per guest per event" without guest accounts.
alter table public.uploads add column guest_token uuid;
create index uploads_event_guest_idx on public.uploads (event_id, guest_token);

notify pgrst, 'reload schema';
