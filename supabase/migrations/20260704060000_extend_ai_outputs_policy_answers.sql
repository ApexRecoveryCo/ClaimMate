alter table public.ai_outputs
  drop constraint ai_outputs_output_type_check;

alter table public.ai_outputs
  add constraint ai_outputs_output_type_check check (
    output_type in ('summary', 'evidence_gaps', 'follow_up_email', 'policy_answer')
  );
