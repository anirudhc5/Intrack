'use client'

import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Application, StatusHistoryEntry, UserPreferences, STATUS_CONFIG, CATEGORY_CONFIG, isGhosted } from '@/lib/types'

interface PipelineChartsProps {
  applications: Application[]
  statusHistory: StatusHistoryEntry[]
  userPreferences: UserPreferences | null
}

export function PipelineCharts({ applications, statusHistory, userPreferences }: PipelineChartsProps) {
  const weeklyGoal = userPreferences?.weekly_goal ?? 6

  // Check empty state
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-8">
        <BarChart3 className="w-12 h-12 text-[#c3c6d7] mb-4" />
        <h2 className="text-[18px] font-semibold text-[#131b2e] mb-2">No applications yet</h2>
        <p className="text-[#434655] text-center max-w-sm">
          Add your first application to see pipeline analytics.
        </p>
      </div>
    )
  }

  // --- Summary Stats ---
  const totalApps = applications.length
  
  const respondedApps = applications.filter(app => !['saved', 'applied', 'withdrawn'].includes(app.status))
  const responseRate = totalApps > 0 ? (respondedApps.length / totalApps) * 100 : 0
  
  const offerApps = applications.filter(app => ['offer', 'accepted'].includes(app.status))
  const offerRate = totalApps > 0 ? (offerApps.length / totalApps) * 100 : 0

  const activePipelineApps = applications.filter(app => ['oa', 'interviewing'].includes(app.status))
  
  // Response rate comparison
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  // Apps applied this month
  const appsThisMonth = applications.filter(app => {
    if (!app.applied_at) return false
    const appliedDate = new Date(app.applied_at)
    return appliedDate >= thisMonthStart
  })
  
  // Apps applied last month
  const appsLastMonth = applications.filter(app => {
    if (!app.applied_at) return false
    const appliedDate = new Date(app.applied_at)
    return appliedDate >= lastMonthStart && appliedDate < thisMonthStart
  })
  
  const responsesThisMonth = appsThisMonth.filter(app => !['saved', 'applied', 'withdrawn'].includes(app.status))
  const responsesLastMonth = appsLastMonth.filter(app => !['saved', 'applied', 'withdrawn'].includes(app.status))
  
  const rrThisMonth = appsThisMonth.length > 0 ? (responsesThisMonth.length / appsThisMonth.length) * 100 : 0
  const rrLastMonth = appsLastMonth.length > 0 ? (responsesLastMonth.length / appsLastMonth.length) * 100 : 0
  const rrDiff = rrThisMonth - rrLastMonth

  // --- Pipeline Funnel Data ---
  const funnelOrder = ['saved', 'applied', 'oa', 'interviewing', 'offer', 'accepted', 'rejected']
  
  // Need actual hex colors for Recharts
  const STATUS_COLORS: Record<string, string> = {
    saved: '#64748b',
    applied: '#64748b',
    oa: '#7c3aed',
    interviewing: '#2563eb',
    offer: '#059669',
    rejected: '#e11d48',
    withdrawn: '#64748b',
    accepted: '#059669',
  }

  const funnelData = useMemo(() => {
    return funnelOrder.map(status => {
      const count = applications.filter(app => app.status === status).length
      
      // Calculate ghosted for "applied"
      let ghostedCount = 0
      if (status === 'applied') {
        ghostedCount = applications.filter(app => app.status === 'applied' && isGhosted(app)).length
      }

      return {
        name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label,
        status: status,
        count: count - ghostedCount,
        ghosted: ghostedCount,
      }
    })
  }, [applications, funnelOrder])

  const CATEGORY_COLORS: Record<string, string> = {
    'SWE': '#1d4ed8', // blue-700
    'MLE/AI': '#6b21a8', // purple-800
    'Data Science': '#0f766e', // teal-700
    'PM': '#c2410c', // orange-700
    'Quant': '#047857', // emerald-700
    'Hardware': '#b91c1c', // red-700
    'Design': '#be185d', // pink-700
    'Other': '#334155', // slate-700
  }

  // --- Velocity Over Time ---
  const velocityData = useMemo(() => {
    const data = []
    const currentDate = new Date()
    for (let i = 7; i >= 0; i--) {
      const end = new Date(currentDate)
      end.setDate(end.getDate() - (i * 7))
      
      const start = new Date(end)
      start.setDate(start.getDate() - 7)
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const weekLabel = `${monthNames[start.getMonth()]} ${start.getDate()}`
      
      const count = applications.filter(app => {
        if (!app.applied_at) return false
        const appliedDate = new Date(app.applied_at)
        return appliedDate >= start && appliedDate < end
      }).length

      data.push({
        week: weekLabel,
        actual: count,
        target: weeklyGoal
      })
    }
    return data
  }, [applications, weeklyGoal])

  // --- Category Distribution ---
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    applications.forEach(app => {
      app.categories.forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1
      })
    })
    
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value)
  }, [applications])

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
          <div className="text-[12px] font-medium text-[#434655] mb-1">Total Applications</div>
          <div className="text-[24px] font-semibold text-[#131b2e]">{totalApps}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
          <div className="text-[12px] font-medium text-[#434655] mb-1 flex items-center justify-between">
            Response Rate
            {rrDiff !== 0 && (
              <span className={`flex items-center text-[10px] px-1.5 py-0.5 rounded ${rrDiff > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {rrDiff > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {Math.abs(rrDiff).toFixed(1)}% vs last mo
              </span>
            )}
          </div>
          <div className="text-[24px] font-semibold text-[#131b2e]">{responseRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
          <div className="text-[12px] font-medium text-[#434655] mb-1">Offer Rate</div>
          <div className="text-[24px] font-semibold text-[#131b2e]">{offerRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
          <div className="text-[12px] font-medium text-[#434655] mb-1">Active Pipeline</div>
          <div className="text-[24px] font-semibold text-[#131b2e]">{activePipelineApps.length}</div>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
        <h3 className="text-[16px] font-medium text-[#131b2e] mb-6">Pipeline Funnel</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f2f3ff" />
              <XAxis type="number" tick={{ fill: '#434655', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#434655', fontSize: 12 }} width={80} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#131b2e' }}
              />
              <Bar dataKey="count" stackId="a" name="Active">
                {
                  funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#64748b'} />
                  ))
                }
              </Bar>
              <Bar dataKey="ghosted" stackId="a" name="Ghosted">
                {
                  funnelData.map((entry, index) => (
                    <Cell key={`cell-ghost-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#64748b'} fillOpacity={0.3} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
          <h3 className="text-[16px] font-medium text-[#131b2e] mb-6">Velocity Over Time</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2f3ff" />
                <XAxis dataKey="week" tick={{ fill: '#434655', fontSize: 12 }} />
                <YAxis tick={{ fill: '#434655', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#434655' }} />
                <Line type="monotone" dataKey="actual" name="Applications" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="step" dataKey="target" name="Weekly Goal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
          <h3 className="text-[16px] font-medium text-[#131b2e] mb-6">Category Distribution</h3>
          <div className="h-[250px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#334155'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#434655] text-[12px]">
                No categories found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
