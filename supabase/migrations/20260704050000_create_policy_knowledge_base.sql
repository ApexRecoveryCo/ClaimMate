create extension if not exists vector with schema extensions;

alter table public.profiles
  add column is_admin boolean not null default false;

-- Security definer so table policies can check admin status without
-- recursive RLS lookups on profiles.
create function public.is_admin ()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid ()),
    false
  );
$$;

create table public.insurers (
  id uuid primary key default gen_random_uuid (),
  brand_name text not null,
  legal_entity_name text,
  underwriter_name text,
  apra_registered_name text,
  website_url text,
  claims_phone text,
  claims_email text,
  complaints_url text,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.insurance_products (
  id uuid primary key default gen_random_uuid (),
  insurer_id uuid not null references public.insurers (id) on delete cascade,
  product_name text not null,
  product_type text not null check (
    product_type in (
      'home_building', 'home_contents', 'home_and_contents',
      'landlord', 'comprehensive_car', 'other'
    )
  ),
  cover_category text,
  state_availability text[],
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each row is one immutable document version. New versions are new rows;
-- old versions are archived/superseded, never overwritten or deleted.
create table public.policy_documents (
  id uuid primary key default gen_random_uuid (),
  insurer_id uuid not null references public.insurers (id) on delete cascade,
  product_id uuid not null references public.insurance_products (id) on delete cascade,
  document_type text not null check (
    document_type in (
      'pds', 'spds', 'key_facts_sheet', 'tmd', 'policy_wording',
      'claims_guide', 'complaints_info', 'other'
    )
  ),
  document_title text not null,
  version_name text,
  modifies_document_id uuid references public.policy_documents (id),
  issue_date date,
  effective_from date,
  effective_to date,
  source_url text not null,
  source_domain text,
  storage_path text not null,
  file_hash text,
  document_status text not null default 'active' check (
    document_status in ('active', 'superseded', 'archived')
  ),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index policy_documents_product_id_idx on public.policy_documents (product_id);

create table public.policy_clauses (
  id uuid primary key default gen_random_uuid (),
  document_id uuid not null references public.policy_documents (id) on delete cascade,
  insurer_id uuid not null references public.insurers (id) on delete cascade,
  product_id uuid not null references public.insurance_products (id) on delete cascade,
  section_title text,
  section_number text,
  page_number integer,
  clause_text text not null,
  clause_category text not null default 'other' check (
    clause_category in (
      'covered_event', 'exclusion', 'limit', 'customer_obligation',
      'claim_condition', 'definition', 'complaint', 'other'
    )
  ),
  plain_english_summary text,
  embedding vector (1024),
  search tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(section_title, '') || ' ' || clause_text || ' ' || coalesce(plain_english_summary, '')
    )
  ) stored,
  approval_status text not null default 'draft' check (
    approval_status in ('draft', 'approved', 'rejected')
  ),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index policy_clauses_document_id_idx on public.policy_clauses (document_id);

create index policy_clauses_search_idx on public.policy_clauses using gin (search);

create index policy_clauses_embedding_idx on public.policy_clauses
  using hnsw (embedding extensions.vector_cosine_ops);

create table public.customer_policies (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_id uuid references public.claims (id) on delete cascade,
  insurer_id uuid references public.insurers (id),
  product_id uuid references public.insurance_products (id),
  policy_document_id uuid references public.policy_documents (id),
  policy_number text,
  policy_start_date date,
  policy_end_date date,
  excess_amount numeric,
  sum_insured_building numeric,
  sum_insured_contents numeric,
  optional_extras text[],
  uploaded_schedule_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_policies_user_id_idx on public.customer_policies (user_id);

create table public.policy_answer_sources (
  id uuid primary key default gen_random_uuid (),
  ai_output_id uuid not null references public.ai_outputs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  policy_clause_id uuid not null references public.policy_clauses (id) on delete cascade,
  document_id uuid not null references public.policy_documents (id) on delete cascade,
  page_number integer,
  relevance_score numeric,
  created_at timestamptz not null default now()
);

-- RLS: the policy library is readable by all signed-in users (approved
-- clauses only for non-admins); writes are admin-only. Customer policies
-- and answer sources are scoped to the owning user.

alter table public.insurers enable row level security;

create policy "Signed-in users can view insurers"
  on public.insurers for select to authenticated using (true);

create policy "Admins can manage insurers"
  on public.insurers for all to authenticated
  using (public.is_admin ()) with check (public.is_admin ());

alter table public.insurance_products enable row level security;

create policy "Signed-in users can view products"
  on public.insurance_products for select to authenticated using (true);

create policy "Admins can manage products"
  on public.insurance_products for all to authenticated
  using (public.is_admin ()) with check (public.is_admin ());

alter table public.policy_documents enable row level security;

create policy "Signed-in users can view policy documents"
  on public.policy_documents for select to authenticated using (true);

create policy "Admins can manage policy documents"
  on public.policy_documents for all to authenticated
  using (public.is_admin ()) with check (public.is_admin ());

alter table public.policy_clauses enable row level security;

create policy "Users can view approved clauses"
  on public.policy_clauses for select to authenticated
  using (approval_status = 'approved' or public.is_admin ());

create policy "Admins can manage clauses"
  on public.policy_clauses for all to authenticated
  using (public.is_admin ()) with check (public.is_admin ());

alter table public.customer_policies enable row level security;

create policy "Users can view their own customer policies"
  on public.customer_policies for select using (auth.uid () = user_id);

create policy "Users can add their own customer policies"
  on public.customer_policies for insert with check (auth.uid () = user_id);

create policy "Users can update their own customer policies"
  on public.customer_policies for update
  using (auth.uid () = user_id) with check (auth.uid () = user_id);

create policy "Users can delete their own customer policies"
  on public.customer_policies for delete using (auth.uid () = user_id);

alter table public.policy_answer_sources enable row level security;

create policy "Users can view their own answer sources"
  on public.policy_answer_sources for select using (auth.uid () = user_id);

create policy "Users can add their own answer sources"
  on public.policy_answer_sources for insert with check (auth.uid () = user_id);

create trigger set_insurers_updated_at
  before update on public.insurers for each row
  execute function public.set_updated_at ();

create trigger set_insurance_products_updated_at
  before update on public.insurance_products for each row
  execute function public.set_updated_at ();

create trigger set_policy_documents_updated_at
  before update on public.policy_documents for each row
  execute function public.set_updated_at ();

create trigger set_policy_clauses_updated_at
  before update on public.policy_clauses for each row
  execute function public.set_updated_at ();

create trigger set_customer_policies_updated_at
  before update on public.customer_policies for each row
  execute function public.set_updated_at ();

-- Private bucket for official policy PDFs (admin-managed) and a separate
-- per-user area is NOT used here — customer schedules stay in claim-evidence.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('policy-documents', 'policy-documents', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "Admins can upload policy documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'policy-documents' and public.is_admin ());

create policy "Admins can view policy documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'policy-documents' and public.is_admin ());

create policy "Admins can delete policy documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'policy-documents' and public.is_admin ());

-- Search helper for RAG retrieval: full-text over approved clauses,
-- optionally filtered to a document set. Runs with the caller's rights, so
-- RLS still applies.
create function public.search_policy_clauses (
  query text,
  document_ids uuid[] default null,
  match_limit int default 12
)
returns setof public.policy_clauses
language sql stable
as $$
  select *
  from public.policy_clauses
  where approval_status = 'approved'
    and (document_ids is null or document_id = any (document_ids))
    and search @@ websearch_to_tsquery('english', query)
  order by ts_rank(search, websearch_to_tsquery('english', query)) desc
  limit match_limit;
$$;

-- Vector variant used when embeddings are configured.
create function public.match_policy_clauses (
  query_embedding vector (1024),
  document_ids uuid[] default null,
  match_limit int default 12
)
returns table (clause public.policy_clauses, similarity float)
language sql stable
as $$
  select c, 1 - (c.embedding <=> query_embedding) as similarity
  from public.policy_clauses c
  where c.approval_status = 'approved'
    and c.embedding is not null
    and (document_ids is null or c.document_id = any (document_ids))
  order by c.embedding <=> query_embedding
  limit match_limit;
$$;
