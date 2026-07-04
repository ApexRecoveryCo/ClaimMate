create table public.ai_outputs (
  id uuid primary key default gen_random_uuid (),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  output_type text not null check (
    output_type in ('summary', 'evidence_gaps', 'follow_up_email')
  ),
  prompt_version text not null,
  input_hash text not null,
  response_text text not null,
  created_at timestamptz not null default now()
);

create index ai_outputs_claim_id_idx on public.ai_outputs (claim_id);

alter table public.ai_outputs enable row level security;

create policy "Users can view their own AI outputs"
  on public.ai_outputs for select
  using (auth.uid () = user_id);

create policy "Users can add their own AI outputs"
  on public.ai_outputs for insert
  with check (auth.uid () = user_id);

create policy "Users can delete their own AI outputs"
  on public.ai_outputs for delete
  using (auth.uid () = user_id);
