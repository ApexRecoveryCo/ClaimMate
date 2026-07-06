export const CLAIM_TYPES = [
  "storm",
  "flood_water",
  "fire_smoke",
  "theft_burglary",
  "car_accident",
  "mould",
  "other",
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_STATUSES = [
  "not_lodged",
  "lodged",
  "in_review",
  "info_requested",
  "approved",
  "declined",
  "settled",
  "closed",
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface Claim {
  id: string;
  user_id: string;
  title: string;
  claim_type: ClaimType;
  claim_type_other: string | null;
  insurer_name: string | null;
  claim_number: string | null;
  policy_number: string | null;
  incident_date: string;
  incident_location: string | null;
  description: string;
  status: ClaimStatus;
  urgent_needs: string | null;
  created_at: string;
  updated_at: string;
}

interface ClaimTypeMeta {
  label: string;
  example: string;
  suggestedEvidence: string[];
}

export const CLAIM_TYPE_META: Record<ClaimType, ClaimTypeMeta> = {
  storm: {
    label: "Storm or hail damage",
    example: "Roof, fence or window damage after a storm",
    suggestedEvidence: [
      "Wide photos of the damaged area",
      "Close-up photos of the damage",
      "Roof, fence or window damage from different angles",
      "Repair quotes",
      "Notes about anything unsafe",
    ],
  },
  flood_water: {
    label: "Flood or water damage",
    example: "Water entering your home, burst pipes, rising water",
    suggestedEvidence: [
      "Photos showing the water line",
      "Photos of damaged contents",
      "Clean-up and drying expenses",
      "Mould photos if it appears",
      "Temporary accommodation expenses",
    ],
  },
  fire_smoke: {
    label: "Fire or smoke damage",
    example: "House fire, bushfire or smoke damage",
    suggestedEvidence: [
      "Fire report if available",
      "Photos of damaged areas and items",
      "Temporary accommodation records",
      "Repair reports",
      "A list of damaged contents",
    ],
  },
  theft_burglary: {
    label: "Theft or burglary",
    example: "Break-in or stolen belongings",
    suggestedEvidence: [
      "Police event number",
      "A list of missing items",
      "Receipts and serial numbers",
      "Photos of any damage from the break-in",
      "Witness notes if any",
    ],
  },
  car_accident: {
    label: "Car accident or damage",
    example: "Collision, hail damage or vandalism to your car",
    suggestedEvidence: [
      "Photos of the damage and the scene",
      "The other party's details if relevant",
      "Repair quote",
      "Insurer claim number",
      "Police report if relevant",
    ],
  },
  mould: {
    label: "Mould",
    example: "Mould growth after a leak or water event",
    suggestedEvidence: [
      "Photos of the mould over time",
      "Maintenance and repair request history",
      "Notes on the water source and ventilation",
      "Expert or inspection reports",
    ],
  },
  other: {
    label: "Something else",
    example: "Any other damage, loss or incident",
    suggestedEvidence: [
      "Photos of any damage or loss",
      "Receipts for affected items",
      "Reports or quotes you already have",
      "Notes about what happened",
    ],
  },
};

export const CLAIM_STATUS_META: Record<
  ClaimStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  not_lodged: { label: "Not lodged yet", tone: "neutral" },
  lodged: { label: "Lodged", tone: "info" },
  in_review: { label: "With insurer", tone: "info" },
  info_requested: { label: "Info requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  settled: { label: "Settled", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export function claimTypeLabel(claim: Pick<Claim, "claim_type" | "claim_type_other">) {
  if (claim.claim_type === "other" && claim.claim_type_other) {
    return claim.claim_type_other;
  }
  return CLAIM_TYPE_META[claim.claim_type].label;
}
