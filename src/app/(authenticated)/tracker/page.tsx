import { createClient } from '@/lib/supabase/server'
import TrackerBoard from '@/components/TrackerBoard'
import { Application } from '@/lib/types'

export const metadata = {
  title: 'Tracker - Intrack',
}

export default async function TrackerPage() {
  const supabase = await createClient()
  
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <div className="h-[calc(100vh-4rem)]">
      <TrackerBoard applications={(applications || []) as Application[]} />
    </div>
  )
}
