create table public.evidence_items (
  id uuid primary key default gen_random_uuid (),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint,
  category text not null check (
    category in (
      'damage_photo', 'receipt', 'quote', 'report',
      'correspondence', 'policy_document', 'video', 'other'
    )
  ),
  captured_at date,
  user_notes text,
  ai_summary text,
  source_type text not null default 'upload' check (source_type in ('upload', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index evidence_items_claim_id_idx on public.evidence_items (claim_id);

create index evidence_items_user_id_idx on public.evidence_items (user_id);

alter table public.evidence_items enable row level security;

create policy "Users can view their own evidence"
  on public.evidence_items for select
  using (auth.uid () = user_id);

create policy "Users can add their own evidence"
  on public.evidence_items for insert
  with check (auth.uid () = user_id);

create policy "Users can update their own evidence"
  on public.evidence_items for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "Users can delete their own evidence"
  on public.evidence_items for delete
  using (auth.uid () = user_id);

create trigger set_evidence_items_updated_at
  before update on public.evidence_items for each row
  execute function public.set_updated_at ();

-- Private evidence bucket. Files live under <user_id>/<claim_id>/<file>,
-- and access is scoped to the first path segment matching the user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-evidence',
  'claim-evidence',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'video/mp4', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

create policy "Users can upload own evidence files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'claim-evidence'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

create policy "Users can view own evidence files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'claim-evidence'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );

create policy "Users can delete own evidence files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'claim-evidence'
    and (storage.foldername (name))[1] = auth.uid ()::text
  );
