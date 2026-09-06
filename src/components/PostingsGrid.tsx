'use client'

import React, { useState, useMemo } from 'react'
import { Search, Globe, ExternalLink, Plus, Briefcase } from 'lucide-react'
import { Posting, ALL_CATEGORIES, CATEGORY_CONFIG, RoleCategory } from '@/lib/types'

// Conditionally importing AddApplicationModal in case it isn't created yet.
let AddApplicationModal: React.ElementType = () => null
try {
  // Try to require it conditionally
  AddApplicationModal = require('./AddApplicationModal').default || require('./AddApplicationModal')
} catch (e) {
  // Fallback if not available
}

interface PostingsGridProps {
  initialPostings: Posting[]
}

export default function PostingsGrid({ initialPostings }: PostingsGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<RoleCategory>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [prefillPosting, setPrefillPosting] = useState<any>(null)

  const toggleCategory = (category: RoleCategory) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedCategories(new Set())
  }

  const filteredPostings = useMemo(() => {
    return initialPostings.filter((posting) => {
      // Filter by search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesCompany = posting.company_name.toLowerCase().includes(query)
        const matchesRole = posting.role_title.toLowerCase().includes(query)
        if (!matchesCompany && !matchesRole) return false
      }

      // Filter by category
      if (selectedCategories.size > 0) {
        const hasMatchingCategory = posting.categories.some((cat) => selectedCategories.has(cat))
        if (!hasMatchingCategory) return false
      }

      return true
    })
  }, [initialPostings, searchQuery, selectedCategories])

  const getCompanyColor = (companyName: string) => {
    const colors = [
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
    ]
    const hash = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-on-surface">Browse Postings</h1>
        <p className="text-on-surface-variant text-sm">Discover new roles and add them to your tracker.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAll}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
              selectedCategories.size === 0
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-white text-[#434655] border-[#c3c6d7] hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const isActive = selectedCategories.has(cat)
            const config = CATEGORY_CONFIG[cat]
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  isActive
                    ? `${config.bgColor} ${config.color} ${config.borderColor}`
                    : 'bg-white text-[#434655] border-[#c3c6d7] hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredPostings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPostings.map((posting) => (
            <div key={posting.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0] hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-start gap-3 flex-1 overflow-hidden">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${getCompanyColor(
                      posting.company_name
                    )}`}
                  >
                    {posting.company_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="font-medium text-on-surface truncate" title={posting.role_title}>
                      {posting.role_title}
                    </h3>
                    <div className="text-xs text-on-surface-variant truncate">
                      {posting.company_name}
                      {posting.location && <span className="mx-1">•</span>}
                      {posting.location && <span>{posting.location}</span>}
                    </div>
                  </div>
                </div>
                {posting.url && (
                  <a
                    href={posting.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-outline hover:text-primary transition-colors shrink-0"
                    title="View Posting"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Categories Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {posting.categories.map((cat) => {
                  const config = CATEGORY_CONFIG[cat]
                  return (
                    <span
                      key={cat}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}
                    >
                      {cat}
                    </span>
                  )
                })}
              </div>

              {/* Salary & Action button anchored to bottom */}
              <div className="mt-auto pt-2 border-t border-outline-variant flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-600 truncate flex-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={posting.salary_text || 'Salary not specified'}>
                    {posting.salary_text || 'N/A'}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setPrefillPosting({
                      posting_id: posting.id,
                      company_name: posting.company_name,
                      role_title: posting.role_title,
                      location: posting.location,
                      salary_text: posting.salary_text,
                      url: posting.url,
                      categories: posting.categories,
                    })
                    setIsModalOpen(true)
                  }}
                  className="text-[#2563eb] bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 text-[12px] font-medium flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Tracker
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-outline-variant rounded-xl bg-white/50">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-on-surface mb-1">
            {initialPostings.length === 0 ? 'No postings available yet' : 'No postings match your filters'}
          </h3>
          <p className="text-on-surface-variant text-sm max-w-sm">
            {initialPostings.length === 0 
              ? 'New internship postings will appear here once ingestion begins.' 
              : 'Try adjusting your search query or unselecting some categories.'}
          </p>
        </div>
      )}

      {/* Add Application Modal (if available) */}
      {AddApplicationModal && (
        <AddApplicationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setPrefillPosting(null)
          }}
          onSaved={() => {
            setIsModalOpen(false)
            setPrefillPosting(null)
            // Ideally we'd redirect to tracker or show success toast here
          }}
          prefillFromPosting={prefillPosting}
        />
      )}
    </div>
  )
}
