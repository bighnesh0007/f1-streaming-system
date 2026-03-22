"use client"
import React from 'react'
import useSWR from 'swr'
import { fetcher, API_POSITIONS_LATEST } from '@/lib/api'

export function Leaderboard() {
  const { data, error } = useSWR(API_POSITIONS_LATEST, fetcher, { refreshInterval: 3000 })
  const isLoading = !data && !error

  if (isLoading) return (
    <div className="card-premium">
      <h3 className="text-sm text-silver" style={{ marginBottom: '1rem' }}>LEADERBOARD</h3>
      {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />)}
    </div>
  )

  return (
    <div className="card-premium" style={{ padding: '1rem' }}>
      <h3 className="text-sm text-silver" style={{ marginBottom: '1rem' }}>LIVE LEADERBOARD</h3>
      <table className="table-premium">
        <thead>
          <tr>
            <th>POS</th>
            <th>DRIVER</th>
            <th>TEAM</th>
            <th>LAST LAP</th>
            <th>BEST LAP</th>
            <th>GAP</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row: any, i: number) => (
            <tr key={row.driver_number}>
              <td style={{ fontWeight: 700, color: i === 0 ? 'var(--color-f1-red)' : 'var(--color-white)' }}>
                P{row.position || i + 1}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {row.headshot_url && <img src={row.headshot_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                  <span style={{ fontWeight: 600 }}>{row.name_acronym}</span>
                  <span className="text-silver text-xs">#{row.driver_number}</span>
                </div>
              </td>
              <td className="text-silver text-xs">{row.team_name || '-'}</td>
              <td className="text-xs">{row.last_lap ? `${row.last_lap.toFixed(3)}s` : '-'}</td>
              <td className="text-xs" style={{ color: 'var(--color-green)' }}>
                {row.best_lap ? `${row.best_lap.toFixed(3)}s` : '-'}
              </td>
              <td className="text-xs" style={{ color: i === 0 ? 'var(--color-green)' : 'var(--color-f1-red)' }}>
                {row.gap || 'LEADER'}
              </td>
            </tr>
          ))}
          {(!data || data.length === 0) && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-silver)' }}>No position data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
