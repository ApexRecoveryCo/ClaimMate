-- LOCAL-ONLY seed, run automatically by `supabase start` / `supabase db reset`.
--
-- Creates a confirmed demo account plus a worked sample claim so the local
-- stack is usable immediately at http://localhost:3000:
--
--     email:    demo@claimmate.test
--     password: password123
--
-- Do NOT run this against a hosted/production project — it writes directly
-- into auth.users, bypassing GoTrue. The hosted demo seed is supabase/seed.sql.

do $$
declare
  v_user_id uuid;
  v_insurer_id uuid;
  v_product_id uuid;
  v_claim_id uuid;
begin
  -- 1. Confirmed demo auth user (+ email identity), idempotent.
  select id into v_user_id from auth.users where email = 'demo@claimmate.test';
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'demo@claimmate.test', extensions.crypt('password123', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo User"}'::jsonb, now(), now()
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'demo@claimmate.test', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;

  -- 2. Sample policy-library rows (idempotent).
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

  -- 3. Sample claim (skip if already seeded).
  if exists (select 1 from public.claims where user_id = v_user_id and title = 'Storm damage to roof (sample)') then
    return;
  end if;

  insert into public.claims (
    user_id, title, claim_type, insurer_name, claim_number, policy_number,
    incident_date, incident_location, description, status, urgent_needs
  ) values (
    v_user_id, 'Storm damage to roof (sample)', 'storm', 'AAMI', 'CLM-2026-04821', 'POL-778213',
    current_date - interval '9 days', '12 Sample Street, Brisbane QLD 4000',
    'A severe hailstorm damaged roof tiles and guttering. Overnight, water entered the ceiling cavity in two bedrooms and stained the plaster. A temporary tarp was placed over the worst section the next morning.',
    'lodged', 'Roof still leaks in heavy rain — need a permanent repair booked.'
  ) returning id into v_claim_id;

  insert into public.evidence_items (claim_id, user_id, storage_path, file_name, file_type, file_size, category, captured_at, user_notes, source_type)
  values
    (v_claim_id, v_user_id, v_user_id || '/' || v_claim_id || '/sample-roof.jpg', 'roof-damage-wide.jpg', 'image/jpeg', 2400000, 'damage_photo', current_date - interval '8 days', 'Wide shot of the damaged roof section taken the morning after.', 'upload'),
    (v_claim_id, v_user_id, v_user_id || '/' || v_claim_id || '/ceiling.jpg', 'ceiling-water-stain.jpg', 'image/jpeg', 1800000, 'damage_photo', current_date - interval '8 days', 'Water staining on the bedroom ceiling.', 'upload'),
    (v_claim_id, v_user_id, v_user_id || '/' || v_claim_id || '/quote.pdf', 'roofing-repair-quote.pdf', 'application/pdf', 90000, 'quote', current_date - interval '4 days', 'Repair quote from a local roofer.', 'upload');

  insert into public.call_logs (claim_id, user_id, call_date, organisation, person_spoken_to, phone_number, summary, promises_made, next_steps)
  values (
    v_claim_id, v_user_id, (current_date - interval '7 days')::timestamptz + time '10:30',
    'AAMI claims team', 'Sarah', '13 22 44',
    'Lodged the claim over the phone and provided the incident details.',
    'An assessor will make contact within 5 business days.',
    'Send through the roof photos and the repair quote.'
  );

  insert into public.timeline_events (claim_id, user_id, event_date, event_type, title, description, source)
  values
    (v_claim_id, v_user_id, current_date - interval '8 days', 'evidence', 'Photographed the damage', 'Wide and close-up photos of the roof and ceiling.', 'user'),
    (v_claim_id, v_user_id, current_date - interval '7 days', 'call', 'Call with AAMI', 'Lodged the claim; assessor to make contact within 5 business days.', 'system'),
    (v_claim_id, v_user_id, current_date - interval '7 days', 'status_change', 'Status changed to "Lodged"', 'Previously "Not lodged yet".', 'system'),
    (v_claim_id, v_user_id, current_date - interval '4 days', 'evidence', 'Added repair quote', 'Quote from a local roofer.', 'user');

  insert into public.customer_policies (
    user_id, claim_id, insurer_id, product_id, policy_number,
    policy_start_date, policy_end_date, excess_amount, sum_insured_building
  ) values (
    v_user_id, v_claim_id, v_insurer_id, v_product_id, 'POL-778213',
    date_trunc('year', current_date)::date, (date_trunc('year', current_date) + interval '1 year')::date,
    500, 650000
  );

  raise notice 'Local demo seeded: login demo@claimmate.test / password123, claim %.', v_claim_id;
end $$;
