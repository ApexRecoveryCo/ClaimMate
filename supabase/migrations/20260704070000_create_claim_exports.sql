create table public.claim_exports (
  id uuid primary key default gen_random_uuid (),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  sections_included text[] not null,
  created_at timestamptz not null default now()
);

create index claim_exports_claim_id_idx on public.claim_exports (claim_id);

alter table public.claim_exports enable row level security;

create policy "Users can view their own exports"
  on public.claim_exports for select
  using (auth.uid () = user_id);

create policy "Users can add their own exports"
  on public.claim_exports for insert
  with check (auth.uid () = user_id);

create policy "Users can delete their own exports"
  on public.claim_exports for delete
  using (auth.uid () = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('claim-exports', 'claim-exports', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "Users can create own export files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'claim-exports'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

create policy "Users can view own export files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'claim-exports'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

create policy "Users can delete own export files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'claim-exports'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );
