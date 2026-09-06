'use client'

import { Application, CATEGORY_CONFIG, formatStatusDisplay, STATUS_CONFIG } from '@/lib/types'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ApplicationCardProps {
  application: Application
  onEdit: (app: Application) => void
}

export default function ApplicationCard({ application, onEdit }: ApplicationCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  
  // simple hash for company color
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
  const hash = application.company_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const avatarColor = colors[hash % colors.length]
  const initial = application.company_name.charAt(0).toUpperCase()

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('applications').delete().eq('id', application.id)
    router.refresh()
  }

  return (
    <div 
      className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md border border-[#e2e8f0] relative group mb-3 cursor-pointer"
      onClick={() => onEdit(application)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-medium ${avatarColor}`}>
            {initial}
          </div>
          <div>
            <h3 className="font-medium text-[#131b2e] truncate max-w-[150px]">{application.role_title}</h3>
            <p className="text-sm text-[#434655] truncate max-w-[150px]">
              {application.company_name} {application.location ? `• ${application.location}` : ''}
            </p>
          </div>
        </div>
        
        <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 group-hover:text-slate-600"
          >
            <MoreHorizontal size={16} />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(application) }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); handleDelete() }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {application.categories.map(cat => {
          const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other']
          return (
            <span key={cat} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
              {cat}
            </span>
          )
        })}
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
        <div className="text-xs text-[#434655] font-medium">
          {formatStatusDisplay(application.status, application.status_detail)}
        </div>
        {application.salary_text && (
          <div className="text-xs font-medium text-slate-600 truncate max-w-[80px]">
            {application.salary_text}
          </div>
        )}
      </div>
    </div>
  )
}
