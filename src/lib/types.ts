// Database types matching the Supabase schema

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'oa'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'accepted'

export type RoleCategory =
  | 'SWE'
  | 'MLE/AI'
  | 'Data Science'
  | 'PM'
  | 'Quant'
  | 'Hardware'
  | 'Design'
  | 'Other'

export interface Application {
  id: string
  user_id: string
  posting_id: string | null
  company_name: string
  role_title: string
  location: string | null
  salary_text: string | null
  url: string | null
  status: ApplicationStatus
  status_detail: string | null
  categories: RoleCategory[]
  notes: string | null
  applied_at: string | null
  created_at: string
  updated_at: string
}

export interface StatusHistoryEntry {
  id: string
  application_id: string
  old_status: ApplicationStatus | null
  new_status: ApplicationStatus
  changed_at: string
}

export interface Posting {
  id: string
  company_name: string
  role_title: string
  location: string | null
  salary_text: string | null
  url: string | null
  description: string | null
  categories: RoleCategory[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  categories: RoleCategory[]
  notify_email: boolean
  weekly_goal: number
  min_salary: number | null
  created_at: string
  updated_at: string
}

// Status display config
export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  saved: { label: 'Saved', color: 'text-slate-700', bgColor: 'bg-slate-50', dotColor: 'bg-slate-500' },
  applied: { label: 'Applied', color: 'text-slate-700', bgColor: 'bg-slate-50', dotColor: 'bg-slate-500' },
  oa: { label: 'OA', color: 'text-violet-700', bgColor: 'bg-violet-50', dotColor: 'bg-violet-500' },
  interviewing: { label: 'Interviewing', color: 'text-blue-700', bgColor: 'bg-blue-50', dotColor: 'bg-blue-500' },
  offer: { label: 'Offer', color: 'text-emerald-700', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-500' },
  rejected: { label: 'Rejected', color: 'text-rose-700', bgColor: 'bg-rose-50', dotColor: 'bg-rose-500' },
  withdrawn: { label: 'Withdrawn', color: 'text-slate-500', bgColor: 'bg-slate-50', dotColor: 'bg-slate-400' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-600' },
}

export const CATEGORY_CONFIG: Record<RoleCategory, { color: string; bgColor: string; borderColor: string }> = {
  'SWE': { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'MLE/AI': { color: 'text-purple-800', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  'Data Science': { color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  'PM': { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  'Quant': { color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'Hardware': { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  'Design': { color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  'Other': { color: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
}

export const ALL_STATUSES: ApplicationStatus[] = [
  'saved', 'applied', 'oa', 'interviewing', 'offer', 'rejected', 'withdrawn', 'accepted'
]

export const ALL_CATEGORIES: RoleCategory[] = [
  'SWE', 'MLE/AI', 'Data Science', 'PM', 'Quant', 'Hardware', 'Design', 'Other'
]

/**
 * Format status for display: "Stage — detail"
 */
export function formatStatusDisplay(status: ApplicationStatus, statusDetail?: string | null): string {
  const config = STATUS_CONFIG[status]
  if (statusDetail) {
    return `${config.label} — ${statusDetail}`
  }
  return config.label
}

/**
 * Check if an application is "ghosted" (applied > 30 days ago with no update)
 */
export function isGhosted(app: Application): boolean {
  if (app.status !== 'applied') return false
  const updatedAt = new Date(app.updated_at)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return updatedAt < thirtyDaysAgo
}

/**
 * Parse salary text to extract numeric value using regex
 */
export function parseSalaryNumeric(salaryText: string | null): number | null {
  if (!salaryText) return null
  // Match patterns like $72, $72/hr, $185,000, $185k, $130k pro-rated
  const match = salaryText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:k|K)?/)
  if (!match) return null
  let value = parseFloat(match[1].replace(/,/g, ''))
  // If 'k' or 'K' suffix, multiply by 1000
  if (/k/i.test(salaryText.substring(salaryText.indexOf(match[1]) + match[1].length))) {
    value *= 1000
  }
  // If it's an hourly rate (contains /hr or per hour), annualize (2080 hours)
  if (/\/\s*hr|per\s*hour/i.test(salaryText)) {
    value *= 2080
  }
  return value
}
