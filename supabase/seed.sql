-- ClaimMate demo seed
--
-- Populates a fresh Supabase project with sample data so a new sign-in has
-- something to look at: one worked storm-damage claim (with a timeline, call
-- log and evidence metadata), plus a couple of insurers/products so the
-- policy page and admin console aren't empty.
--
-- How to run:
--   1. Sign up in the app first (the account must exist in auth.users).
--   2. In the Supabase SQL editor, set the email below to your account's
--      email, then run this whole file. It's safe to re-run — it skips the
--      sample claim if it already exists for that user, and won't duplicate
--      the sample insurers/products.
--
-- Note: evidence rows reference storage paths that have no real uploaded
-- files, so previews/thumbnails show a graceful fallback. Everything else
-- (dashboard, claim detail, timeline, calls, policy options) renders fully.

do $$
declare
  -- >>> CHANGE THIS to the email you signed up with <<<
  v_email text := 'you@example.com';

  v_user_id uuid;
  v_insurer_id uuid;
  v_product_id uuid;
  v_claim_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email;
  if v_user_id is null then
    raise exception 'No auth user with email %. Sign up in the app first.', v_email;
  end if;

  -- Global policy-library rows (idempotent via existence checks — these
  -- tables have no unique constraint to rely on).
  select id into v_insurer_id from public.insurers where brand_name = 'AAMI' limit 1;
  if v_insurer_id is null then
    insert into public.insurers (brand_name, legal_entity_name, underwriter_name, apra_registered_name, website_url, claims_phone, complaints_url)
    values ('AAMI', 'AAI Limited', 'AAI Limited', 'AAI Limited', 'https://www.aami.com.au', '13 22 44', 'https://www.aami.com.au/aami/complaints.html')
    returning id into v_insurer_id;
  end if;

  if not exists (select 1 from public.insurers where brand_name = 'NRMA Insurance') then
    insert into public.insurers (brand_name, legal_entity_name, underwriter_name, website_url, claims_phone)
    values ('NRMA Insurance', 'Insurance Australia Limited', 'Insurance Australia Limited', 'https://www.nrma.com.au', '13 11 23');
  end if;

  select id into v_product_id from public.insurance_products
    where insurer_id = v_insurer_id and product_name = 'Home and Contents Insurance' limit 1;
  if v_product_id is null then
    insert into public.insurance_products (insurer_id, product_name, product_type, cover_category, state_availability)
    values (v_insurer_id, 'Home and Contents Insurance', 'home_and_contents', 'Standard cover', array['QLD','NSW','VIC'])
    returning id into v_product_id;
  end if;

  -- Skip the sample claim if it's already been seeded for this user.
  if exists (
    select 1 from public.claims
    where user_id = v_user_id and title = 'Storm damage to roof (sample)'
  ) then
    raise notice 'Sample claim already exists for %, skipping.', v_email;
    return;
  end if;

  insert into public.claims (
    user_id, title, claim_type, insurer_name, claim_number, policy_number,
    incident_date, incident_location, description, status, urgent_needs
  ) values (
    v_user_id,
    'Storm damage to roof (sample)',
    'storm',
    'AAMI',
    'CLM-2026-04821',
    'POL-778213',
    current_date - interval '9 days',
    '12 Sample Street, Brisbane QLD 4000',
    'A severe hailstorm damaged roof tiles and guttering. Overnight, water entered the ceiling cavity in two bedrooms and stained the plaster. A temporary tarp was placed over the worst section the next morning.',
    'lodged',
    'Roof still leaks in heavy rain — need a permanent repair booked.'
  ) returning id into v_claim_id;

  -- Evidence (metadata only; no real files uploaded).
  insert into public.evidence_items (claim_id, user_id, storage_path, file_name, file_type, file_size, category, captured_at, user_notes, source_type)
  values
    (v_claim_id, v_user_id, v_user_id || '/' || v_claim_id || '/sample-roof.jpg', 'roof-damage-wide.jpg', 'image/jpeg', 2400000, 'damage_photo', current_date - interval '8 days', 'Wide shot of the damaged roof section taken the morning after.', 'upload'),
    (v_claim_id, v_user_id, v_user_id || '/' || v_claim_id || '/ceiling.jpg', 'ceiling-water-stain.jpg', 'image/jpeg', 1800000, 'damage_photo', current_date - interval '8 days', 'Water staining on the bedroom ceiling.', 'upload'),
    (v_claim_id, v_user_id, v_user_id || '/' || v_claim_id || '/quote.pdf', 'roofing-repair-quote.pdf', 'application/pdf', 90000, 'quote', current_date - interval '4 days', 'Repair quote from a local roofer.', 'upload');

  -- Call log.
  insert into public.call_logs (claim_id, user_id, call_date, organisation, person_spoken_to, phone_number, summary, promises_made, next_steps)
  values (
    v_claim_id, v_user_id, (current_date - interval '7 days')::timestamptz + time '10:30',
    'AAMI claims team', 'Sarah', '13 22 44',
    'Lodged the claim over the phone and provided the incident details.',
    'An assessor will make contact within 5 business days.',
    'Send through the roof photos and the repair quote.'
  );

  -- Timeline (the incident anchor is rendered by the app from the claim date).
  insert into public.timeline_events (claim_id, user_id, event_date, event_type, title, description, source)
  values
    (v_claim_id, v_user_id, current_date - interval '8 days', 'evidence', 'Photographed the damage', 'Wide and close-up photos of the roof and ceiling.', 'user'),
    (v_claim_id, v_user_id, current_date - interval '7 days', 'call', 'Call with AAMI', 'Lodged the claim; assessor to make contact within 5 business days.', 'system'),
    (v_claim_id, v_user_id, current_date - interval '7 days', 'status_change', 'Status changed to "Lodged"', 'Previously "Not lodged yet".', 'system'),
    (v_claim_id, v_user_id, current_date - interval '4 days', 'evidence', 'Added repair quote', 'Quote from a local roofer.', 'user');

  -- Link the claim to a policy so the policy Q&A page has context.
  insert into public.customer_policies (
    user_id, claim_id, insurer_id, product_id, policy_number,
    policy_start_date, policy_end_date, excess_amount, sum_insured_building
  ) values (
    v_user_id, v_claim_id, v_insurer_id, v_product_id, 'POL-778213',
    date_trunc('year', current_date)::date, (date_trunc('year', current_date) + interval '1 year')::date,
    500, 650000
  );

  raise notice 'Seeded sample claim % for %.', v_claim_id, v_email;
end;
$$;
