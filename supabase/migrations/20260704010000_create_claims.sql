create table public.claims (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  claim_type text not null check (
    claim_type in (
      'storm', 'flood_water', 'fire_smoke', 'theft_burglary',
      'car_accident', 'mould', 'other'
    )
  ),
  claim_type_other text,
  insurer_name text,
  claim_number text,
  policy_number text,
  incident_date date not null,
  incident_location text,
  description text not null,
  status text not null default 'not_lodged' check (
    status in (
      'not_lodged', 'lodged', 'in_review', 'info_requested',
      'approved', 'declined', 'settled', 'closed'
    )
  ),
  urgent_needs text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claims_user_id_idx on public.claims (user_id);

alter table public.claims enable row level security;

create policy "Users can view their own claims"
  on public.claims for select
  using (auth.uid () = user_id);

create policy "Users can create their own claims"
  on public.claims for insert
  with check (auth.uid () = user_id);

create policy "Users can update their own claims"
  on public.claims for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "Users can delete their own claims"
  on public.claims for delete
  using (auth.uid () = user_id);

create trigger set_claims_updated_at
  before update on public.claims for each row
  execute function public.set_updated_at ();
