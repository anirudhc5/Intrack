export default function PreferencesLoading() {
  return (
    <div className="flex-1 overflow-y-auto space-y-6 animate-pulse">
      {/* Page Heading */}
      <div className="h-8 w-60 bg-slate-200 rounded-lg" />

      <div className="max-w-3xl space-y-6">
        {/* Card 1: Profile Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="h-4 w-36 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-80 bg-slate-100 rounded" />
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5 max-w-md">
            <div className="h-3.5 w-20 bg-slate-200 rounded" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>

          {/* Email addresses */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="h-3.5 w-28 bg-slate-200 rounded" />
            <div className="h-3 w-96 bg-slate-100 rounded" />
            <div className="h-10 max-w-lg bg-slate-100 rounded-lg" />
            <div className="flex gap-2 max-w-lg">
              <div className="flex-1 h-9 bg-slate-100 rounded-lg" />
              <div className="h-9 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Card 2: Preferred Role Categories */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-4">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-16 bg-slate-200 rounded-full" />
            <div className="h-7 w-20 bg-slate-200 rounded-full" />
            <div className="h-7 w-24 bg-slate-200 rounded-full" />
            <div className="h-7 w-14 bg-slate-200 rounded-full" />
            <div className="h-7 w-16 bg-slate-200 rounded-full" />
            <div className="h-7 w-20 bg-slate-200 rounded-full" />
            <div className="h-7 w-18 bg-slate-200 rounded-full" />
            <div className="h-7 w-16 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* Card 3: Weekly Application Goal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="h-4 w-44 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-96 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-32 bg-slate-100 rounded-lg" />
            <div className="h-3.5 w-36 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Card 4: Email Notifications Toggle */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="h-4 w-36 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-72 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-11 bg-slate-200 rounded-full" />
            <div className="h-3.5 w-36 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Card 5: Salary Distribution Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-4">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-80 bg-slate-100 rounded" />
          </div>
          <div className="h-48 bg-slate-50 rounded-lg flex items-end justify-between p-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full bg-slate-200 rounded-t"
                style={{ height: `${25 + ((i * 19) % 55)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Save Button Skeleton */}
        <div className="flex justify-end pt-2 pb-8">
          <div className="h-10 w-36 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
