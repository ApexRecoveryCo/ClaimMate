-- Lets a signed-in user permanently delete their own account. Cascades
-- through profiles, claims, evidence rows, logs, outputs and purchases via
-- existing foreign keys. Storage objects are removed by the app before this
-- runs.
create function public.delete_user ()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid ();
end;
$$;

revoke execute on function public.delete_user () from public;

grant execute on function public.delete_user () to authenticated;

-- One-off claim pack purchases (Stripe). Rows are written by the webhook
-- using the service role, so no insert policy is needed.
create table public.purchases (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_id uuid not null references public.claims (id) on delete cascade,
  stripe_session_id text not null unique,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index purchases_claim_id_idx on public.purchases (claim_id);

alter table public.purchases enable row level security;

create policy "Users can view their own purchases"
  on public.purchases for select
  using (auth.uid () = user_id);
