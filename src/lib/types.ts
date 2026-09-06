// Database types matching the Supabase schema (intrack-schema.sql)

export type ApplicationStatus =
    | "saved"
    | "applied"
    | "oa"
    | "interview_1"
    | "interview_2"
    | "interview_3+"
    | "offer"
    | "accepted"
    | "rejected"
    | "withdrawn";

// Per section 5 taxonomy — underscores, not slashes or spaces
export type RoleCategory =
    | "SWE"
    | "MLE_AI"
    | "Data_Science"
    | "PM"
    | "Quant"
    | "Hardware"
    | "Design"
    | "Other";

export interface Application {
    id: string;
    user_id: string;
    posting_id: string | null;
    title: string;
    company: string;
    jd_text: string | null;
    location: string | null;
    url: string | null;
    salary_text: string | null;
    status: ApplicationStatus;
    status_detail: string | null;
    categories: RoleCategory[];
    status_history: StatusHistoryEntry[];
    notes: string | null;
    applied_at: string | null;
    created_at: string;
    updated_at: string;
}

// status_history is a jsonb array stored directly on the applications row —
// not a separate table with its own FK.
export interface StatusHistoryEntry {
    status: ApplicationStatus;
    status_detail: string | null;
    changed_at: string;
}

export interface Posting {
    id: string;
    source: string;
    external_id: string;
    canonical_id: string;
    title: string;
    company: string;
    categories: RoleCategory[];
    location: string | null;
    jd_text: string | null;
    url: string;
    salary_text: string | null;
    posted_at: string | null;
    first_seen_at: string;
    is_active: boolean;
    raw: Record<string, unknown> | null;
    // NOTE: no `updated_at` column exists on postings — don't reintroduce it
}

export interface UserPreferences {
    // user_id is the primary key itself, not a separate `id` column
    user_id: string;
    categories: RoleCategory[];
    notify_email: boolean;
    weekly_goal: number;
    // NOTE: no `min_salary`, `created_at`, or `updated_at` columns exist on
    // user_preferences per the schema — remove until/unless actually added
}

// Status display config
export const STATUS_CONFIG: Record<
    ApplicationStatus,
    { label: string; color: string; bgColor: string; dotColor: string }
> = {
    saved: {
        label: "Saved",
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        dotColor: "bg-slate-500",
    },
    applied: {
        label: "Applied",
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        dotColor: "bg-slate-500",
    },
    oa: {
        label: "OA",
        color: "text-violet-700",
        bgColor: "bg-violet-50",
        dotColor: "bg-violet-500",
    },
    interview_1: {
        label: "Interview — Round 1",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        dotColor: "bg-blue-500",
    },
    interview_2: {
        label: "Interview — Round 2",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        dotColor: "bg-blue-600",
    },
    "interview_3+": {
        label: "Interview — Round 3+",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        dotColor: "bg-blue-700",
    },
    offer: {
        label: "Offer",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        dotColor: "bg-emerald-500",
    },
    accepted: {
        label: "Accepted",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        dotColor: "bg-emerald-600",
    },
    rejected: {
        label: "Rejected",
        color: "text-rose-700",
        bgColor: "bg-rose-50",
        dotColor: "bg-rose-500",
    },
    withdrawn: {
        label: "Withdrawn",
        color: "text-slate-500",
        bgColor: "bg-slate-50",
        dotColor: "bg-slate-400",
    },
};

export const CATEGORY_CONFIG: Record<
    RoleCategory,
    { label: string; color: string; bgColor: string; borderColor: string }
> = {
    SWE: {
        label: "SWE",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
    },
    MLE_AI: {
        label: "MLE / AI",
        color: "text-purple-800",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
    },
    Data_Science: {
        label: "Data Science",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
    },
    PM: {
        label: "PM",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
    },
    Quant: {
        label: "Quant",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
    },
    Hardware: {
        label: "Hardware",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
    },
    Design: {
        label: "Design",
        color: "text-pink-700",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
    },
    Other: {
        label: "Other",
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
    },
};

export const ALL_STATUSES: ApplicationStatus[] = [
    "saved",
    "applied",
    "oa",
    "interview_1",
    "interview_2",
    "interview_3+",
    "offer",
    "accepted",
    "rejected",
    "withdrawn",
];

export const ALL_CATEGORIES: RoleCategory[] = [
    "SWE",
    "MLE_AI",
    "Data_Science",
    "PM",
    "Quant",
    "Hardware",
    "Design",
    "Other",
];

// Linear pipeline order for correction/undo logic.
// rejected/withdrawn are terminal exits, not part of the forward scale —
// they're intentionally excluded so a rejection is never auto-trimmed.
export const STATUS_ORDER: Partial<Record<ApplicationStatus, number>> = {
  saved: 0,
  applied: 1,
  oa: 2,
  interview_1: 3,
  interview_2: 4,
  "interview_3+": 5,
  offer: 6,
  accepted: 7,
};

/**
 * When correcting to an earlier (or same) stage, drop every trailing
 * history entry that's at or past the corrected stage's rank, so a
 * mistaken OA/interview entry doesn't linger once you've backed out of it.
 * Statuses outside STATUS_ORDER (rejected, withdrawn) are left untouched —
 * they're exits, not points on the scale, so no trimming applies to them.
 */
export function trimHistoryForCorrection(
  history: StatusHistoryEntry[],
  newStatus: ApplicationStatus,
): StatusHistoryEntry[] {
  const newRank = STATUS_ORDER[newStatus];
  if (newRank === undefined) return history;

  const trimmed = [...history];
  while (trimmed.length > 0) {
    const lastRank = STATUS_ORDER[trimmed[trimmed.length - 1].status];
    if (lastRank !== undefined && lastRank >= newRank) {
      trimmed.pop();
    } else {
      break;
    }
  }
  return trimmed;
}

/**
 * Format status for display: "Stage — detail"
 */
export function formatStatusDisplay(
    status: ApplicationStatus,
    statusDetail?: string | null,
): string {
    const config = STATUS_CONFIG[status];
    if (statusDetail) {
        return `${config.label} — ${statusDetail}`;
    }
    return config.label;
}

/**
 * Check if an application is "ghosted" (applied > 30 days ago with no update)
 */
export function isGhosted(app: Application): boolean {
    if (app.status !== "applied") return false;
    const updatedAt = new Date(app.updated_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return updatedAt < thirtyDaysAgo;
}

/**
 * Parse salary text to extract numeric value using regex
 */
export function parseSalaryNumeric(salaryText: string | null): number | null {
    if (!salaryText) return null;
    const match = salaryText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:k|K)?/);
    if (!match) return null;
    let value = parseFloat(match[1].replace(/,/g, ""));
    if (
        /k/i.test(
            salaryText.substring(
                salaryText.indexOf(match[1]) + match[1].length,
            ),
        )
    ) {
        value *= 1000;
    }
    if (/\/\s*hr|per\s*hour/i.test(salaryText)) {
        value *= 2080;
    }
    return value;
}
