create table public.call_logs (
  id uuid primary key default gen_random_uuid (),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  call_date timestamptz not null,
  organisation text not null,
  person_spoken_to text,
  phone_number text,
  summary text not null,
  promises_made text,
  next_steps text,
  created_at timestamptz not null default now()
);

create index call_logs_claim_id_idx on public.call_logs (claim_id);

alter table public.call_logs enable row level security;

create policy "Users can view their own call logs"
  on public.call_logs for select
  using (auth.uid () = user_id);

create policy "Users can add their own call logs"
  on public.call_logs for insert
  with check (auth.uid () = user_id);

create policy "Users can delete their own call logs"
  on public.call_logs for delete
  using (auth.uid () = user_id);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid (),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_date date not null,
  event_type text not null check (
    event_type in (
      'incident', 'call', 'correspondence', 'insurer_update',
      'status_change', 'evidence', 'note', 'other'
    )
  ),
  title text not null,
  description text,
  linked_evidence_ids uuid[],
  source text not null default 'user' check (source in ('user', 'ai', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index timeline_events_claim_id_idx on public.timeline_events (claim_id);

alter table public.timeline_events enable row level security;

create policy "Users can view their own timeline events"
  on public.timeline_events for select
  using (auth.uid () = user_id);

create policy "Users can add their own timeline events"
  on public.timeline_events for insert
  with check (auth.uid () = user_id);

create policy "Users can update their own timeline events"
  on public.timeline_events for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "Users can delete their own timeline events"
  on public.timeline_events for delete
  using (auth.uid () = user_id);

create trigger set_timeline_events_updated_at
  before update on public.timeline_events for each row
  execute function public.set_updated_at ();
