'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  type UserPreferences,
  type RoleCategory,
  ALL_CATEGORIES,
  CATEGORY_CONFIG,
  parseSalaryNumeric,
} from '@/lib/types'
import { Save, Minus, Plus, Bell, BellOff, DollarSign, Target, Check } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface PreferencesFormProps {
  preferences: UserPreferences | null
  postings: { salary_text: string | null }[]
  userId: string
}

export default function PreferencesForm({ preferences, postings, userId }: PreferencesFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<RoleCategory[]>(
    (preferences?.categories as RoleCategory[]) || []
  )
  const [weeklyGoal, setWeeklyGoal] = useState(preferences?.weekly_goal ?? 6)
  const [notifyEmail, setNotifyEmail] = useState(preferences?.notify_email ?? true)
  const [minSalary, setMinSalary] = useState<number | null>(preferences?.min_salary ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const toggleCategory = (cat: RoleCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    const { error } = await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        categories,
        notify_email: notifyEmail,
        weekly_goal: weeklyGoal,
        min_salary: minSalary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    setIsSaving(false)
    if (error) {
      setSaveStatus('error')
      console.error('Save error:', error)
    } else {
      setSaveStatus('success')
      router.refresh()
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // Build salary histogram data
  const salaryValues = postings
    .map((p) => parseSalaryNumeric(p.salary_text))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)

  const salaryBuckets = buildSalaryBuckets(salaryValues)

  return (
    <div className="space-y-6">
      {/* Save Status Banner */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          <Check className="w-4 h-4" />
          Preferences saved successfully.
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          Failed to save preferences. Please try again.
        </div>
      )}

      {/* Role Category Preferences */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <h2 className="text-[15px] font-semibold text-[#131b2e] mb-1">Preferred Role Categories</h2>
        <p className="text-[12px] text-[#434655] mb-4">Select the types of roles you&apos;re interested in</p>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = categories.includes(cat)
            const config = CATEGORY_CONFIG[cat]
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  isActive
                    ? `${config.bgColor} ${config.color} ${config.borderColor}`
                    : 'bg-white text-[#434655] border-[#c3c6d7] hover:bg-[#f2f3ff]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </section>

      {/* Weekly Application Goal */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-[#2563eb]" />
          <h2 className="text-[15px] font-semibold text-[#131b2e]">Weekly Application Goal</h2>
        </div>
        <p className="text-[12px] text-[#434655] mb-4">
          Set your target for applications per week. This appears as the target line in Pipeline Overview.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-[#c3c6d7] rounded-lg overflow-hidden">
            <button
              onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))}
              className="px-3 py-2 text-[#434655] hover:bg-[#f2f3ff] transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-[15px] font-semibold text-[#131b2e] min-w-[3rem] text-center border-x border-[#c3c6d7]">
              {weeklyGoal}
            </span>
            <button
              onClick={() => setWeeklyGoal(Math.min(50, weeklyGoal + 1))}
              className="px-3 py-2 text-[#434655] hover:bg-[#f2f3ff] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[13px] text-[#434655]">applications per week</span>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-1">
          {notifyEmail ? (
            <Bell className="w-4 h-4 text-[#2563eb]" />
          ) : (
            <BellOff className="w-4 h-4 text-[#737686]" />
          )}
          <h2 className="text-[15px] font-semibold text-[#131b2e]">Email Notifications</h2>
        </div>
        <p className="text-[12px] text-[#434655] mb-4">
          Get notified about status changes and deadlines
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotifyEmail(!notifyEmail)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifyEmail ? 'bg-[#2563eb]' : 'bg-[#c3c6d7]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                notifyEmail ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-[13px] text-[#131b2e]">
            {notifyEmail ? 'Notifications enabled' : 'Notifications disabled'}
          </span>
        </div>
      </section>

      {/* Alert Threshold */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-[#059669]" />
          <h2 className="text-[15px] font-semibold text-[#131b2e]">Alert Threshold</h2>
        </div>
        <p className="text-[12px] text-[#434655] mb-4">
          Only receive instant alerts for postings meeting your minimum compensation. Matching is deterministic — no AI scoring.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-sm">$</span>
            <input
              type="number"
              value={minSalary ?? ''}
              onChange={(e) => setMinSalary(e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 60000"
              className="h-9 pl-7 pr-3 w-40 rounded-lg bg-white border border-[#c3c6d7] text-[13px] text-[#131b2e] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] outline-none"
            />
          </div>
          <span className="text-[13px] text-[#434655]">annualized minimum</span>
        </div>
      </section>

      {/* Salary Distribution */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <h2 className="text-[15px] font-semibold text-[#131b2e] mb-1">Market Salary Distribution</h2>
        <p className="text-[12px] text-[#434655] mb-4">
          Based on {salaryValues.length} postings with salary data (regex-parsed, no AI)
        </p>
        {salaryValues.length === 0 ? (
          <div className="text-center py-8 text-[#737686]">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-[13px]">No salary data available yet</p>
            <p className="text-[11px]">Salary distribution will appear once postings with compensation data are ingested.</p>
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryBuckets} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaedff" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#434655' }}
                  tickLine={false}
                  axisLine={{ stroke: '#c3c6d7' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#434655' }}
                  tickLine={false}
                  axisLine={{ stroke: '#c3c6d7' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                {minSalary !== null && (
                  <ReferenceLine
                    x={findBucketForValue(salaryBuckets, minSalary)}
                    stroke="#e11d48"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: 'Your threshold',
                      position: 'top',
                      fill: '#e11d48',
                      fontSize: 10,
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-2 pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#2563eb] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#1d4ed8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Utility: Build salary histogram buckets
function buildSalaryBuckets(values: number[]): { label: string; count: number; min: number; max: number }[] {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const bucketCount = Math.min(6, Math.max(3, Math.ceil(values.length / 3)))
  const bucketSize = range / bucketCount || 1

  const buckets: { label: string; count: number; min: number; max: number }[] = []
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize
    const bucketMax = i === bucketCount - 1 ? max + 1 : min + (i + 1) * bucketSize
    const count = values.filter((v) => v >= bucketMin && v < bucketMax).length
    buckets.push({
      label: `$${formatSalaryK(bucketMin)}–${formatSalaryK(bucketMax)}`,
      count,
      min: bucketMin,
      max: bucketMax,
    })
  }
  return buckets
}

function formatSalaryK(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`
  }
  return `${Math.round(value)}`
}

function findBucketForValue(buckets: { label: string; min: number; max: number }[], value: number): string | undefined {
  const bucket = buckets.find((b) => value >= b.min && value < b.max)
  return bucket?.label || buckets[buckets.length - 1]?.label
}
