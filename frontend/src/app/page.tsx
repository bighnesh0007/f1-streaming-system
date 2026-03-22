"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { Activity, Gauge, Trophy, AlertCircle, Wifi } from 'lucide-react'
import { fetcher, API_DRIVERS, getTelemetryUrl, getAnalyticsUrl } from '@/lib/api'
import { DriverCard } from '@/components/DriverCard'
import { TelemetryChart } from '@/components/TelemetryChart'
import { Leaderboard } from '@/components/Leaderboard'
import { WeatherWidget } from '@/components/WeatherWidget'
import { SessionSelector } from '@/components/SessionSelector'
import { RaceControlFeed } from '@/components/RaceControlFeed'
import { PitStopTable } from '@/components/PitStopTable'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function Home() {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(1)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const { isConnected } = useWebSocket()

  const { data: drivers, error: driversError } = useSWR(API_DRIVERS, fetcher)
  const { data: analytics } = useSWR(
    selectedDriver ? getAnalyticsUrl(selectedDriver) : null, fetcher
  )
  const { data: telemetry, error: telemetryError } = useSWR(
    selectedDriver ? getTelemetryUrl(selectedDriver, 100) : null,
    fetcher, { refreshInterval: 2000 }
  )

  const isLoading = !drivers && !driversError
  const activeAnalytics = analytics?.[0] || {}

  return (
    <div>
      {/* Header */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Circuit Overview</h2>
          <p className="text-silver text-sm">Live telemetry and performance analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SessionSelector value={sessionId} onChange={setSessionId} />
          <div className="badge-live">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? 'var(--color-green)' : 'var(--color-f1-red)' }} />
            {isConnected ? 'LIVE' : 'CONNECTING'}
          </div>
        </div>
      </header>

      {/* Race Control Feed */}
      <div style={{ marginBottom: '2rem' }}>
        <RaceControlFeed sessionId={sessionId} />
      </div>

      {/* Stats Row */}
      <div className="grid-stats" style={{ marginBottom: '2rem' }}>
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Trophy size={20} color="var(--color-f1-red)" />
            <span className="text-xs text-silver">AVG SPEED</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>
            {activeAnalytics.avg_speed ? Math.round(activeAnalytics.avg_speed) : '--'}
            <span className="text-sm text-silver" style={{ fontWeight: 400, marginLeft: '0.4rem' }}>km/h</span>
          </p>
        </div>

        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Gauge size={20} color="var(--color-f1-red)" />
            <span className="text-xs text-silver">AI SCORE</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>
            {activeAnalytics.prediction_score ? (activeAnalytics.prediction_score * 100).toFixed(1) : '--'}
            <span className="text-sm text-silver" style={{ fontWeight: 400, marginLeft: '0.4rem' }}>/ 100</span>
          </p>
        </div>

        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Activity size={20} color="var(--color-f1-red)" />
            <span className="text-xs text-silver">TOP SPEED</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>
            {activeAnalytics.max_speed ? Math.round(activeAnalytics.max_speed) : '--'}
            <span className="text-sm text-silver" style={{ fontWeight: 400, marginLeft: '0.4rem' }}>km/h</span>
          </p>
        </div>

        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Wifi size={20} color="var(--color-green)" />
            <span className="text-xs text-silver">THROTTLE ON</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>
            {activeAnalytics.throttle_on_pct != null ? activeAnalytics.throttle_on_pct.toFixed(1) : '--'}
            <span className="text-sm text-silver" style={{ fontWeight: 400, marginLeft: '0.4rem' }}>%</span>
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ marginBottom: '2rem' }}>
        <Leaderboard />
      </div>

      {/* Telemetry + Sidebar */}
      <div className="grid-2col">
        <section>
          {telemetryError ? (
            <div className="card-premium" style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--color-f1-red)' }}>
              <AlertCircle size={48} />
              <p>Unable to load telemetry data</p>
            </div>
          ) : telemetry && telemetry.length > 0 ? (
            <TelemetryChart data={telemetry} title={`LIVE TELEMETRY — DRIVER #${selectedDriver}`} />
          ) : (
            <div className="card-premium" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="badge-live" style={{ animation: 'none' }}>Awaiting telemetry data...</div>
            </div>
          )}
        </section>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <WeatherWidget />
          <h3 className="text-sm" style={{ marginTop: '0.5rem' }}>ACTIVE DRIVERS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {isLoading ? (
              [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)
            ) : drivers?.map((driver: any) => (
              <div key={driver.driver_number} onClick={() => setSelectedDriver(driver.driver_number)} style={{ cursor: 'pointer' }}>
                <DriverCard driver={driver} isActive={selectedDriver === driver.driver_number} />
              </div>
            ))}
          </div>
          
          {selectedDriver && (
            <div style={{ marginTop: '1rem' }}>
              <PitStopTable driverNumber={selectedDriver} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
