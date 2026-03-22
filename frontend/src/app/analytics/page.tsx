"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { BarChart3, TrendingUp } from 'lucide-react'
import { fetcher, API_ANALYTICS, API_DRIVERS, getCompareUrl } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts'

const COMPARE_COLORS = ['#e10600', '#00d26a', '#3b82f6', '#facc15']

export default function AnalyticsPage() {
  const { data: analytics } = useSWR(API_ANALYTICS, fetcher)
  const { data: drivers } = useSWR(API_DRIVERS, fetcher)

  const [compareDrivers, setCompareDrivers] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'compare'>('overview')

  const { data: compareData } = useSWR(
    compareDrivers.length >= 2 ? getCompareUrl(compareDrivers, 60) : null,
    fetcher
  )

  const toggleCompare = (dn: number) => {
    setCompareDrivers(prev => {
      if (prev.includes(dn)) return prev.filter(d => d !== dn)
      if (prev.length >= 4) return prev
      return [...prev, dn]
    })
  }

  // Prepare bar chart data from analytics
  const barData = (analytics || []).map((a: any) => ({
    name: a.name_acronym || `#${a.driver_number}`,
    avg_speed: a.avg_speed || 0,
    max_speed: a.max_speed || 0,
    throttle_on_pct: a.throttle_on_pct || 0,
    prediction: a.prediction_score ? (a.prediction_score * 100) : 0,
  }))

  const tooltipStyle = {
    background: 'var(--color-carbon-main)',
    border: '1px solid var(--color-glass-border)',
    borderRadius: '8px', fontSize: '0.75rem',
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <BarChart3 size={24} color="var(--color-f1-red)" />
          <h2 style={{ fontSize: '1.75rem' }}>Analytics</h2>
        </div>
        <p className="text-sm text-silver">Comparative performance analysis and multi-driver telemetry overlay</p>
      </header>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-item ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>Multi-Driver Compare</button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Speed Comparison Bar */}
          <div className="card-premium" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <h3 className="text-sm text-silver" style={{ marginBottom: '1rem' }}>SPEED COMPARISON</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--color-silver)" fontSize={11} />
                  <YAxis stroke="var(--color-silver)" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="avg_speed" fill="var(--color-f1-red)" name="Avg Speed" radius={[4,4,0,0]} />
                  <Bar dataKey="max_speed" fill="var(--color-blue)" name="Max Speed" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="card-premium" style={{ padding: '1rem' }}>
            <h3 className="text-sm text-silver" style={{ marginBottom: '1rem' }}>ALL DRIVER ANALYTICS</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>DRIVER</th><th>TEAM</th><th>AVG SPD</th><th>MAX SPD</th>
                    <th>THROTTLE %</th><th>BRAKE AGG</th><th>CONSISTENCY</th><th>AI SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics || []).map((a: any) => (
                    <tr key={a.driver_number}>
                      <td style={{ fontWeight: 600 }}>{a.name_acronym} <span className="text-xs text-silver">#{a.driver_number}</span></td>
                      <td className="text-xs text-silver">{a.team_name || '-'}</td>
                      <td>{a.avg_speed?.toFixed(1) || '-'}</td>
                      <td>{a.max_speed?.toFixed(1) || '-'}</td>
                      <td>{a.throttle_on_pct?.toFixed(1) || '-'}%</td>
                      <td>{a.brake_aggression?.toFixed(1) || '-'}</td>
                      <td>{a.lap_consistency?.toFixed(4) || '-'}</td>
                      <td style={{ color: 'var(--color-green)' }}>{a.prediction_score ? (a.prediction_score * 100).toFixed(1) : '-'}</td>
                    </tr>
                  ))}
                  {(!analytics || analytics.length === 0) && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-silver)' }}>No analytics data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'compare' && (
        <>
          {/* Driver Picker */}
          <div className="card-premium" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <h3 className="text-sm text-silver" style={{ marginBottom: '0.75rem' }}>SELECT 2–4 DRIVERS TO COMPARE</h3>
            <div className="toggle-group">
              {(drivers || []).map((d: any, i: number) => (
                <label
                  key={d.driver_number}
                  className={`toggle-chip ${compareDrivers.includes(d.driver_number) ? 'active' : ''}`}
                  style={{ color: compareDrivers.includes(d.driver_number) ? COMPARE_COLORS[compareDrivers.indexOf(d.driver_number)] : 'var(--color-silver)' }}
                >
                  <input type="checkbox" checked={compareDrivers.includes(d.driver_number)} onChange={() => toggleCompare(d.driver_number)} />
                  {d.name_acronym || `#${d.driver_number}`}
                </label>
              ))}
            </div>
          </div>

          {/* Compare Chart */}
          {compareData && compareData.length >= 2 ? (
            <div className="card-premium" style={{ padding: '1.5rem' }}>
              <h3 className="text-sm text-silver" style={{ marginBottom: '1rem' }}>SPEED OVERLAY</h3>
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="index" stroke="var(--color-silver)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-silver)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    {compareData.map((group: any, i: number) => {
                      const lineData = group.telemetry.map((t: any, idx: number) => ({ index: idx, speed: t.speed })).reverse()
                      return (
                        <Line
                          key={group.driver.number}
                          data={lineData}
                          type="monotone"
                          dataKey="speed"
                          stroke={COMPARE_COLORS[i]}
                          strokeWidth={2}
                          dot={false}
                          name={`${group.driver.acronym} #${group.driver.number}`}
                          animationDuration={300}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="card-premium" style={{ padding: '3rem', textAlign: 'center' }}>
              <TrendingUp size={48} color="var(--color-silver)" style={{ marginBottom: '1rem' }} />
              <p className="text-silver">Select at least 2 drivers above to compare their speed traces</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
