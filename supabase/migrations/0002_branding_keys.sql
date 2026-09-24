-- Logo and cover live in a private R2 bucket. We store the object key
-- (e.g. events/<id>/branding/logo-<uuid>.webp) and sign short-lived URLs on read.
alter table public.events rename column logo_url to logo_key;
alter table public.events rename column cover_url to cover_key;

-- New brand palette: orange instead of the old lime default.
alter table public.events alter column primary_color set default '#ff6a33';
update public.events set primary_color = '#ff6a33' where primary_color = '#bdff3c';

notify pgrst, 'reload schema';
