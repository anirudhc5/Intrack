import { createClient } from '@/lib/supabase/server'
import { PipelineCharts } from '@/components/PipelineCharts'

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: applications } = await supabase.from('applications').select('*')
  const { data: statusHistory } = await supabase.from('status_history').select('*')
  const { data: userPreferences } = await supabase.from('user_preferences').select('*').maybeSingle()

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      <h1 className="text-2xl font-semibold text-[#131b2e]">Pipeline Overview</h1>
      <PipelineCharts 
        applications={applications || []} 
        statusHistory={statusHistory || []} 
        userPreferences={userPreferences} 
      />
    </div>
  )
}
