'use client'

import { useState } from 'react'
import { Application, ALL_CATEGORIES, RoleCategory, STATUS_CONFIG, ALL_STATUSES, CATEGORY_CONFIG } from '@/lib/types'
import ApplicationCard from './ApplicationCard'
import AddApplicationModal from './AddApplicationModal'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TrackerBoard({ applications }: { applications: Application[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory | 'All'>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | undefined>(undefined)

  const filteredApps = applications.filter(app => {
    const matchesSearch = search === '' || 
      app.company.toLowerCase().includes(search.toLowerCase()) || 
      app.title.toLowerCase().includes(search.toLowerCase())
      
    const matchesCategory = selectedCategory === 'All' || app.categories.includes(selectedCategory)
    
    return matchesSearch && matchesCategory
  })

  const handleEdit = (app: Application) => {
    setEditingApp(app)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingApp(undefined)
  }

  const handleSaved = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[#131b2e]">My Applications</h1>
          <button
            onClick={() => { setEditingApp(undefined); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 font-medium transition-colors cursor-pointer"
          >
            <Plus size={18} /> Add Application
          </button>
        </div>
        
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar items-center">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap border cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {CATEGORY_CONFIG[cat]?.label || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 -mx-2 px-2">
        <div className="flex gap-4 h-full">
          {ALL_STATUSES.map(status => {
            const config = STATUS_CONFIG[status]
            const apps = filteredApps.filter(app => app.status === status)
            
            return (
              <div key={status} className="bg-[#f2f3ff] p-3 rounded-2xl w-[300px] flex-shrink-0 flex flex-col h-full border border-indigo-50/50">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                  <h3 className="font-medium text-[#131b2e]">{config.label}</h3>
                  <span className="bg-white border border-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-auto font-medium">
                    {apps.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar pb-2">
                  <div className="space-y-3">
                    {apps.map(app => (
                      <ApplicationCard key={app.id} application={app} onEdit={handleEdit} />
                    ))}
                  </div>
                  {apps.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200/60 rounded-xl mt-2 bg-white/40">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
        editingApplication={editingApp}
      />
    </div>
  )
}
