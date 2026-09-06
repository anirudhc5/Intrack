export default function PipelineLoading() {
  return (
    <div className="flex-1 overflow-y-auto space-y-6 animate-pulse">
      {/* Page Title */}
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0] space-y-2"
          >
            <div className="h-3 w-28 bg-slate-100 rounded" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main Sankey Diagram Card Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-6">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-[320px] bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
          <div className="flex items-center gap-12 opacity-60">
            <div className="space-y-4">
              <div className="h-10 w-24 bg-slate-200 rounded-md" />
              <div className="h-10 w-24 bg-slate-200 rounded-md" />
            </div>
            <div className="h-1 w-20 bg-slate-200" />
            <div className="space-y-6">
              <div className="h-12 w-28 bg-slate-200 rounded-md" />
              <div className="h-8 w-28 bg-slate-200 rounded-md" />
            </div>
            <div className="h-1 w-20 bg-slate-200" />
            <div className="space-y-4">
              <div className="h-10 w-24 bg-slate-200 rounded-md" />
              <div className="h-8 w-24 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column Charts Skeleton: Velocity & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Over Time Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-[250px] bg-slate-50 rounded-lg flex items-end justify-between p-6 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-full bg-slate-200 rounded-t"
                style={{ height: `${20 + ((i * 17) % 65)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Category Distribution Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0] space-y-4">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-[250px] bg-slate-50 rounded-lg flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-8 border-slate-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
