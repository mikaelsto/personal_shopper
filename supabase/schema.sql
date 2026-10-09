-- Runnista's Supabase database (project "runnista", eu-north-1). Run once in the SQL Editor.
-- Keeps ♥ saved products and 👍/👎 palette votes per signed-in user; see web/sync.js.

-- ♥ saved products. The snapshot keeps title/price/image/link, so items that leave the feed still show.
create table public.saved_products (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  product_id text not null,
  snapshot   jsonb not null default '{}',
  saved_at   timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 👍/👎 "is this in my palette?" votes. selection = the palette/colour filter the vote was made under.
create table public.palette_votes (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  product_id text not null,
  selection  text not null,
  vote       smallint not null check (vote in (-1, 1)),
  voted_at   timestamptz not null default now(),
  primary key (user_id, product_id, selection)
);

-- Everyone can only see and change their own rows.
alter table public.saved_products enable row level security;
alter table public.palette_votes  enable row level security;

create policy "own rows" on public.saved_products for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.palette_votes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.saved_products, public.palette_votes to authenticated;
