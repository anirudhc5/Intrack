export default function TrackerLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>

        {/* Search & Category Filter Skeleton */}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="w-72 h-9 bg-slate-200 rounded-lg" />
          <div className="flex gap-2 overflow-hidden items-center">
            <div className="h-7 w-12 bg-slate-200 rounded-full" />
            <div className="h-7 w-16 bg-slate-200 rounded-full" />
            <div className="h-7 w-20 bg-slate-200 rounded-full" />
            <div className="h-7 w-24 bg-slate-200 rounded-full" />
            <div className="h-7 w-14 bg-slate-200 rounded-full" />
            <div className="h-7 w-16 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Skeleton */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 -mx-2 px-2">
        <div className="flex gap-4 h-full">
          {Array.from({ length: 6 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="bg-[#f2f3ff]/60 p-3 rounded-2xl w-[300px] flex-shrink-0 flex flex-col h-full border border-indigo-50/50"
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-5 w-7 bg-slate-200 rounded-full ml-auto" />
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-hidden">
                {Array.from({ length: colIndex % 2 === 0 ? 3 : 2 }).map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="bg-white rounded-xl p-3 shadow-sm border border-[#e2e8f0] space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-4 w-12 bg-slate-100 rounded-full" />
                      <div className="h-4 w-14 bg-slate-100 rounded-full" />
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                      <div className="h-3 w-14 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
