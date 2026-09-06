'use client'

import { useState, useEffect } from 'react'
import { Application, ALL_CATEGORIES, ALL_STATUSES, RoleCategory, ApplicationStatus, CATEGORY_CONFIG } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface AddApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  editingApplication?: Application
}

export default function AddApplicationModal({ isOpen, onClose, onSaved, editingApplication }: AddApplicationModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [companyName, setCompanyName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [location, setLocation] = useState('')
  const [salaryText, setSalaryText] = useState('')
  const [url, setUrl] = useState('')
  const [categories, setCategories] = useState<RoleCategory[]>([])
  const [status, setStatus] = useState<ApplicationStatus>('applied')
  const [statusDetail, setStatusDetail] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (editingApplication) {
        setCompanyName(editingApplication.company_name || '')
        setRoleTitle(editingApplication.role_title || '')
        setLocation(editingApplication.location || '')
        setSalaryText(editingApplication.salary_text || '')
        setUrl(editingApplication.url || '')
        setCategories(editingApplication.categories || [])
        setStatus(editingApplication.status || 'applied')
        setStatusDetail(editingApplication.status_detail || '')
        setNotes(editingApplication.notes || '')
      } else {
        setCompanyName('')
        setRoleTitle('')
        setLocation('')
        setSalaryText('')
        setUrl('')
        setCategories([])
        setStatus('applied')
        setStatusDetail('')
        setNotes('')
      }
    }
  }, [isOpen, editingApplication])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const toggleCategory = (cat: RoleCategory) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat))
    } else {
      setCategories([...categories, cat])
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    
    if (!userId) {
      setLoading(false)
      return
    }

    const payload = {
      user_id: userId,
      company_name: companyName,
      role_title: roleTitle,
      location: location || null,
      salary_text: salaryText || null,
      url: url || null,
      status,
      status_detail: statusDetail || null,
      categories,
      notes: notes || null
    }

    if (editingApplication) {
      await supabase.from('applications').update(payload).eq('id', editingApplication.id)
      
      if (editingApplication.status !== status) {
        await supabase.from('status_history').insert({
          application_id: editingApplication.id,
          old_status: editingApplication.status,
          new_status: status
        })
      }
    } else {
      const { data } = await supabase.from('applications').insert(payload).select().single()
      if (data) {
        await supabase.from('status_history').insert({
          application_id: data.id,
          old_status: null,
          new_status: status
        })
      }
    }
    
    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-[#131b2e]">
            {editingApplication ? 'Edit Application' : 'Add Application'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Company *</label>
              <input
                value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Role Title *</label>
              <input
                value={roleTitle} onChange={e => setRoleTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="Software Engineer"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Location</label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Salary / Rate</label>
              <input
                value={salaryText} onChange={e => setSalaryText(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="$120,000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Posting URL</label>
            <input
              type="url"
              value={url} onChange={e => setUrl(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Categories</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => {
                const isSelected = categories.includes(cat)
                const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other']
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      isSelected 
                        ? `${config.bgColor} ${config.color} ${config.borderColor}` 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}
                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Status Detail</label>
              <input
                value={statusDetail} onChange={e => setStatusDetail(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="e.g. Round 2 System Design"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full p-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 min-h-[100px] text-sm"
              placeholder="Any additional notes..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!companyName || !roleTitle || loading}
            className="px-4 py-2 text-sm bg-[#2563eb] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </div>
    </div>
  )
}
