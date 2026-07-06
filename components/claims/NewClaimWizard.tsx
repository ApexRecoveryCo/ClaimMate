"use client";

import { useState, useTransition } from "react";
import { createClaim, type NewClaimInput } from "@/app/(app)/claims/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { CLAIM_TYPES, CLAIM_TYPE_META } from "@/types/claims";

const emptyInput: NewClaimInput = {
  claimType: "",
  claimTypeOther: "",
  title: "",
  incidentDate: "",
  incidentLocation: "",
  description: "",
  urgentNeeds: "",
  insurerName: "",
  claimNumber: "",
  policyNumber: "",
  status: "not_lodged",
};

export function NewClaimWizard() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState(emptyInput);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  function set<K extends keyof NewClaimInput>(key: K, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createClaim(input);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">Step {step} of 3</p>

      {step === 1 && (
        <>
          <h1 className="text-2xl font-semibold text-ink">What happened?</h1>
          <Notice tone="info">
            If there is immediate danger, contact emergency services first.
            ClaimMate can wait.
          </Notice>
          <div className="flex flex-col gap-3">
            {CLAIM_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set("claimType", type)}
                className={cn(
                  "rounded-xl border bg-surface p-4 text-left transition-colors",
                  input.claimType === type
                    ? "border-brand-600 ring-2 ring-brand-200"
                    : "border-border hover:border-brand-300",
                )}
              >
                <span className="block font-medium text-ink">
                  {CLAIM_TYPE_META[type].label}
                </span>
                <span className="block text-sm text-ink-muted">
                  {CLAIM_TYPE_META[type].example}
                </span>
              </button>
            ))}
          </div>
          {input.claimType === "other" && (
            <Label>
              In a few words, what happened?
              <Input
                value={input.claimTypeOther}
                onChange={(e) => set("claimTypeOther", e.target.value)}
                placeholder="e.g. Damage from a fallen tree"
              />
            </Label>
          )}
          <Button
            onClick={() => {
              if (!input.claimType) {
                setError("Choose what happened to continue.");
                return;
              }
              if (input.claimType === "other" && !input.claimTypeOther.trim()) {
                setError("Tell us in a few words what happened.");
                return;
              }
              setError(null);
              setStep(2);
            }}
          >
            Continue
          </Button>
        </>
      )}

      {step === 2 && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setStep(3);
          }}
        >
          <h1 className="text-2xl font-semibold text-ink">The basic facts</h1>
          <Card className="flex flex-col gap-4">
            <Label>
              When did it happen?
              <Input
                type="date"
                required
                max={today}
                value={input.incidentDate}
                onChange={(e) => set("incidentDate", e.target.value)}
              />
            </Label>
            <Label>
              Where did it happen?{" "}
              <span className="font-normal text-ink-muted">(optional)</span>
              <Input
                value={input.incidentLocation}
                onChange={(e) => set("incidentLocation", e.target.value)}
                placeholder="e.g. 12 Sample St, Brisbane"
              />
            </Label>
            <Label>
              What happened, in your own words?
              <Textarea
                required
                minLength={20}
                value={input.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the damage or loss. Rough notes are fine — you can edit this later."
              />
            </Label>
            <Label>
              Anything urgent right now?{" "}
              <span className="font-normal text-ink-muted">(optional)</span>
              <Textarea
                rows={2}
                value={input.urgentNeeds}
                onChange={(e) => set("urgentNeeds", e.target.value)}
                placeholder="e.g. Roof is leaking, need temporary accommodation"
              />
            </Label>
            <Label>
              Claim name{" "}
              <span className="font-normal text-ink-muted">
                (optional — we&apos;ll suggest one)
              </span>
              <Input
                value={input.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Storm damage to roof"
              />
            </Label>
          </Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h1 className="text-2xl font-semibold text-ink">
            Your insurance details
          </h1>
          <p className="text-sm text-ink-muted">
            Not sure yet? Leave anything blank — you can add it later.
          </p>
          <Card className="flex flex-col gap-4">
            <Label>
              Insurer name
              <Input
                value={input.insurerName}
                onChange={(e) => set("insurerName", e.target.value)}
                placeholder="e.g. AAMI"
              />
            </Label>
            <Label>
              Claim number
              <Input
                value={input.claimNumber}
                onChange={(e) => set("claimNumber", e.target.value)}
              />
            </Label>
            <Label>
              Policy number
              <Input
                value={input.policyNumber}
                onChange={(e) => set("policyNumber", e.target.value)}
              />
            </Label>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-ink">
                Have you lodged the claim with your insurer?
              </legend>
              {(
                [
                  ["not_lodged", "Not yet"],
                  ["lodged", "Yes, it's lodged"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 text-sm text-ink"
                >
                  <input
                    type="radio"
                    name="status"
                    className="min-h-0 h-4 w-4 accent-brand-600"
                    checked={input.status === value}
                    onChange={() => set("status", value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </Card>
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating your claim…" : "Create claim"}
            </Button>
          </div>
        </form>
      )}

      {step === 1 && error && <Notice tone="danger">{error}</Notice>}
    </div>
  );
}
