"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Timer, Zap, Gauge } from 'lucide-react'
import Link from 'next/link'
import { fetcher, getDriverUrl, getAnalyticsUrl, getTelemetryUrl, getLapsUrl } from '@/lib/api'
import { TelemetryChart } from '@/components/TelemetryChart'

export default function DriverDetailPage() {
  const params = useParams()
  const id = Number(params.id)

  const { data: driver } = useSWR(getDriverUrl(id), fetcher)
  const { data: analytics } = useSWR(getAnalyticsUrl(id), fetcher)
  const { data: telemetry } = useSWR(getTelemetryUrl(id, 150), fetcher, { refreshInterval: 3000 })
  const { data: laps } = useSWR(getLapsUrl(id), fetcher)

  const stats = analytics?.[0] || analytics || {}

  return (
    <div>
      {/* Back link */}
      <Link href="/drivers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-silver)', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Back to Drivers
      </Link>

      {/* Driver Header */}
      <div className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem' }}>
        {driver?.headshot_url ? (
          <img src={driver.headshot_url} alt={driver?.full_name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--color-carbon-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800 }}>{id}</span>
          </div>
        )}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{driver?.full_name || `Driver #${id}`}</h2>
          <p className="text-silver text-sm">{driver?.team_name || 'Unknown Team'} · #{id} · {driver?.country_code || ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: '2rem' }}>
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Zap size={16} color="var(--color-f1-red)" />
            <span className="text-xs text-silver">AVG SPEED</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.avg_speed ? Math.round(stats.avg_speed) : '--'}<span className="text-xs text-silver" style={{ marginLeft: 4 }}>km/h</span></p>
        </div>
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Gauge size={16} color="var(--color-f1-red)" />
            <span className="text-xs text-silver">MAX SPEED</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.max_speed ? Math.round(stats.max_speed) : '--'}<span className="text-xs text-silver" style={{ marginLeft: 4 }}>km/h</span></p>
        </div>
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Timer size={16} color="var(--color-green)" />
            <span className="text-xs text-silver">THROTTLE ON</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.throttle_on_pct != null ? `${stats.throttle_on_pct.toFixed(1)}%` : '--'}</p>
        </div>
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Gauge size={16} color="var(--color-yellow)" />
            <span className="text-xs text-silver">BRAKE AGGRESSION</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.brake_aggression != null ? stats.brake_aggression.toFixed(1) : '--'}</p>
        </div>
      </div>

      {/* Telemetry Chart */}
      {telemetry && telemetry.length > 0 ? (
        <div style={{ marginBottom: '2rem' }}>
          <TelemetryChart data={telemetry} title={`TELEMETRY — #${id} ${driver?.name_acronym || ''}`} />
        </div>
      ) : (
        <div className="card-premium" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <p className="text-silver">No telemetry data available for this driver</p>
        </div>
      )}

      {/* Laps Table */}
      <div className="card-premium" style={{ padding: '1rem' }}>
        <h3 className="text-sm text-silver" style={{ marginBottom: '1rem' }}>LAP HISTORY</h3>
        {laps && laps.length > 0 ? (
          <table className="table-premium">
            <thead>
              <tr><th>LAP</th><th>TIME</th><th>S1</th><th>S2</th><th>S3</th></tr>
            </thead>
            <tbody>
              {laps.map((lap: any) => (
                <tr key={lap.id || lap.lap_number}>
                  <td style={{ fontWeight: 700 }}>{lap.lap_number}</td>
                  <td>{lap.lap_duration ? `${lap.lap_duration.toFixed(3)}s` : '-'}</td>
                  <td className="text-xs">{lap.sector_1 ? `${lap.sector_1.toFixed(3)}` : '-'}</td>
                  <td className="text-xs">{lap.sector_2 ? `${lap.sector_2.toFixed(3)}` : '-'}</td>
                  <td className="text-xs">{lap.sector_3 ? `${lap.sector_3.toFixed(3)}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-silver text-sm" style={{ padding: '2rem', textAlign: 'center' }}>No lap data available</p>
        )}
      </div>
    </div>
  )
}
