export default function PostingsLoading() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 animate-pulse">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1.5">
        <div className="h-8 w-52 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100 rounded" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-7 w-12 bg-slate-200 rounded-full" />
          <div className="h-7 w-14 bg-slate-100 rounded-full" />
          <div className="h-7 w-20 bg-slate-100 rounded-full" />
          <div className="h-7 w-24 bg-slate-100 rounded-full" />
          <div className="h-7 w-12 bg-slate-100 rounded-full" />
          <div className="h-7 w-16 bg-slate-100 rounded-full" />
          <div className="h-7 w-18 bg-slate-100 rounded-full" />
          <div className="h-7 w-16 bg-slate-100 rounded-full" />
        </div>

        {/* Search Input Skeleton */}
        <div className="w-full max-w-md h-10 bg-slate-200 rounded-lg" />
      </div>

      {/* Grid of Posting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0] flex flex-col h-48 justify-between"
          >
            <div>
              {/* Header: Company Icon, Title, and Location */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-1.5 mb-3">
                <div className="h-4 w-12 bg-slate-100 rounded" />
                <div className="h-4 w-16 bg-slate-100 rounded" />
              </div>
            </div>

            {/* Bottom Bar: Salary and CTA button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
              <div className="h-7 w-28 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
