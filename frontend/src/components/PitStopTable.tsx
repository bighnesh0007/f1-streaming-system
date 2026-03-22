"use client"
import React from 'react'
import useSWR from 'swr'
import { fetcher, getPitStopsUrl } from '@/lib/api'
import { Timer } from 'lucide-react'

export function PitStopTable({ driverNumber }: { driverNumber: number }) {
  const { data: stops } = useSWR(getPitStopsUrl(driverNumber), fetcher, { refreshInterval: 10000 })

  if (!stops || stops.length === 0) return (
    <div className="card-premium" style={{ padding: '1rem' }}>
      <h3 className="text-xs text-silver" style={{ marginBottom: '0.75rem' }}>PIT STOPS</h3>
      <p className="text-silver text-xs">No pit stops recorded</p>
    </div>
  )

  return (
    <div className="card-premium" style={{ padding: '1rem' }}>
      <h3 className="text-xs text-silver" style={{ marginBottom: '0.75rem' }}>PIT STOP HISTORY</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th className="text-xs text-silver" style={{ padding: '0.5rem 0' }}>STOP</th>
            <th className="text-xs text-silver" style={{ padding: '0.5rem 0' }}>LAP</th>
            <th className="text-xs text-silver" style={{ padding: '0.5rem 0', textAlign: 'right' }}>DURATION</th>
          </tr>
        </thead>
        <tbody>
          {stops.map((stop: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>#{stop.stop_number}</td>
              <td style={{ padding: '0.75rem 0' }}>{stop.lap_number}</td>
              <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--color-f1-red)', fontWeight: 700 }}>
                {stop.duration.toFixed(3)}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
