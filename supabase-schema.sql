create table if not exists public.articles (
    id text primary key,
    category text not null default 'general' check (category in ('destacada', 'secundaria', 'opinion', 'general')),
    kicker text not null default '',
    title text not null,
    subtitle text not null default '',
    image text not null default '',
    caption text not null default '',
    content text not null default '',
    author text not null default '',
    tags text not null default '',
    date date not null default current_date,
    published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.articles enable row level security;

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
    on public.articles for select
    using (published = true);

drop policy if exists "Authenticated users can manage articles" on public.articles;
create policy "Authenticated users can manage articles"
    on public.articles for all
    to authenticated
    using (true)
    with check (true);

create or replace function public.set_article_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
before update on public.articles
for each row execute function public.set_article_updated_at();

alter table public.articles add column if not exists tags text not null default '';

create table if not exists public.page_views (
    id uuid primary key default gen_random_uuid(),
    article_id text not null,
    viewed_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

drop policy if exists "Public can register page views" on public.page_views;
create policy "Public can register page views"
    on public.page_views for insert
    to anon, authenticated
    with check (length(article_id) > 0);

drop policy if exists "Authenticated users can read page views" on public.page_views;
create policy "Authenticated users can read page views"
    on public.page_views for select
    to authenticated
    using (true);

create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    article_id text not null,
    name text not null,
    email text not null default '',
    body text not null,
    approved boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "Public can send comments" on public.comments;
create policy "Public can send comments"
    on public.comments for insert
    to anon, authenticated
    with check (length(name) between 2 and 80 and length(body) between 3 and 2000);

drop policy if exists "Public can read approved comments" on public.comments;
create policy "Public can read approved comments"
    on public.comments for select
    to anon, authenticated
    using (approved = true);

drop policy if exists "Authenticated users can moderate comments" on public.comments;
create policy "Authenticated users can moderate comments"
    on public.comments for update, delete
    to authenticated
    using (true)
    with check (true);

insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload article images" on storage.objects;
create policy "Authenticated users can upload article images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'article-images');

drop policy if exists "Public can view article images" on storage.objects;
create policy "Public can view article images"
    on storage.objects for select
    to public
    using (bucket_id = 'article-images');
