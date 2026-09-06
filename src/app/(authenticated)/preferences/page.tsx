import { createClient } from '@/lib/supabase/server'
import PreferencesForm from '@/components/PreferencesForm'

export default async function PreferencesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const [preferencesRes, postingsRes] = await Promise.all([
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('postings').select('salary_text').not('salary_text', 'is', null)
  ])

  const preferences = preferencesRes.error ? null : preferencesRes.data
  const postings = postingsRes.data || []
  const notificationEmails: string[] = preferences?.notification_emails ?? []

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      <h1 className="text-2xl font-semibold text-[#131b2e]">Preferences & Settings</h1>
      <div className="max-w-3xl">
        <PreferencesForm 
          preferences={preferences} 
          postings={postings}
          userId={user.id}
          user={user}
          notificationEmails={notificationEmails}
        />
      </div>
    </div>
  )
}
