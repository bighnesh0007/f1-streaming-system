"use client"
import React from 'react'
import useSWR from 'swr'
import { fetcher, getStandingsUrl } from '@/lib/api'
import { Trophy, Users, Building2 } from 'lucide-react'

export default function StandingsPage() {
  const { data, error } = useSWR(getStandingsUrl(2024), fetcher)
  const isLoading = !data && !error

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Championship Standings</h2>
        <p className="text-silver text-sm">2024 Season — Real-time updates (Beta)</p>
      </header>

      <div className="grid-2col" style={{ alignItems: 'start' }}>
        {/* Drivers Standings */}
        <section className="card-premium" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Users size={20} color="var(--color-f1-red)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>DRIVERS' CHAMPIONSHIP</h3>
          </div>
          
          {isLoading ? (
            [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)
          ) : data?.drivers?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th className="text-xs text-silver" style={{ paddingBottom: '0.75rem' }}>POS</th>
                  <th className="text-xs text-silver" style={{ paddingBottom: '0.75rem' }}>DRIVER</th>
                  <th className="text-xs text-silver" style={{ paddingBottom: '0.75rem', textAlign: 'right' }}>POINTS</th>
                </tr>
              </thead>
              <tbody>
                {data.drivers.map((d: any) => (
                  <tr key={d.driver_number} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 800, fontSize: '1.1rem' }}>{d.position}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <div style={{ fontWeight: 600 }}>{d.full_name}</div>
                      <div className="text-xs text-silver">{d.team_name}</div>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--color-white)' }}>
                      {d.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-silver">Awaiting standings data...</p>
          )}
        </section>

        {/* Teams Standings */}
        <section className="card-premium" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Building2 size={20} color="var(--color-yellow)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>CONSTRUCTORS' CHAMPIONSHIP</h3>
          </div>

          {isLoading ? (
            [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)
          ) : data?.teams?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th className="text-xs text-silver" style={{ paddingBottom: '0.75rem' }}>POS</th>
                  <th className="text-xs text-silver" style={{ paddingBottom: '0.75rem' }}>CONSTRUCTOR</th>
                  <th className="text-xs text-silver" style={{ paddingBottom: '0.75rem', textAlign: 'right' }}>POINTS</th>
                </tr>
              </thead>
              <tbody>
                {data.teams.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 800, fontSize: '1.1rem' }}>{t.position}</td>
                    <td style={{ padding: '1rem 0', fontWeight: 600 }}>{t.team_name}</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--color-white)' }}>
                      {t.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-silver">Awaiting standings data...</p>
          )}
        </section>
      </div>
    </div>
  )
}
