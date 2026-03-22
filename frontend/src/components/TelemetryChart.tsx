"use client"

import React, { useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'

interface TelemetryData {
  speed?: number; throttle?: number; rpm?: number;
  brake?: number; gear?: number; drs?: number;
  recorded_at?: string;
}

interface TelemetryChartProps {
  data: TelemetryData[];
  title?: string;
  showToggles?: boolean;
}

const SERIES_CONFIG: Record<string, { color: string; label: string; yAxisId?: number }> = {
  speed: { color: '#e10600', label: 'Speed (km/h)' },
  throttle: { color: '#00d26a', label: 'Throttle (%)' },
  rpm: { color: '#3b82f6', label: 'RPM', yAxisId: 1 },
  brake: { color: '#facc15', label: 'Brake' },
  gear: { color: '#a855f7', label: 'Gear', yAxisId: 2 },
  drs: { color: '#06b6d4', label: 'DRS', yAxisId: 2 },
}

export const TelemetryChart = ({ data, title = "Real-time Telemetry", showToggles = true }: TelemetryChartProps) => {
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(['speed', 'throttle', 'brake']))
  const [viewMode, setViewMode] = useState<'line' | 'composite'>('line')

  const chartData = data.map(d => ({
    ...d,
    time: d.recorded_at ? new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
    brakeVal: d.brake ? 100 : 0,
  }))

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const tooltipStyle = {
    background: 'var(--color-carbon-main)',
    border: '1px solid var(--color-glass-border)',
    borderRadius: '8px', fontSize: '0.75rem',
  }

  return (
    <div className="card-premium" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 className="text-sm text-silver">{title}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`toggle-chip ${viewMode === 'line' ? 'active' : ''}`}
            style={{ color: 'var(--color-white)' }}
            onClick={() => setViewMode('line')}
          >Lines</button>
          <button
            className={`toggle-chip ${viewMode === 'composite' ? 'active' : ''}`}
            style={{ color: 'var(--color-green)' }}
            onClick={() => setViewMode('composite')}
          >Brake+Throttle</button>
        </div>
      </div>

      {/* Toggle chips */}
      {showToggles && (
        <div className="toggle-group" style={{ marginBottom: '1rem' }}>
          {Object.entries(SERIES_CONFIG).map(([key, cfg]) => (
            <label
              key={key}
              className={`toggle-chip ${visibleSeries.has(key) ? 'active' : ''}`}
              style={{ color: visibleSeries.has(key) ? cfg.color : 'var(--color-silver)' }}
            >
              <input type="checkbox" checked={visibleSeries.has(key)} onChange={() => toggleSeries(key)} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
              {cfg.label}
            </label>
          ))}
        </div>
      )}

      {/* Main chart */}
      <div style={{ height: viewMode === 'composite' ? 320 : 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'composite' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--color-silver)" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis stroke="var(--color-silver)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="throttle" stroke="#00d26a" fill="rgba(0, 210, 106, 0.15)" strokeWidth={2} name="Throttle %" animationDuration={300} />
              <Area type="monotone" dataKey="brakeVal" stroke="#facc15" fill="rgba(250, 204, 21, 0.15)" strokeWidth={2} name="Brake" animationDuration={300} />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--color-silver)" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis stroke="var(--color-silver)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId={1} hide />
              <YAxis yAxisId={2} hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '8px' }} />
              {visibleSeries.has('speed') && <Line type="monotone" dataKey="speed" stroke="#e10600" strokeWidth={2} dot={false} name="Speed" animationDuration={300} />}
              {visibleSeries.has('throttle') && <Line type="monotone" dataKey="throttle" stroke="#00d26a" strokeWidth={1.5} dot={false} name="Throttle" animationDuration={300} />}
              {visibleSeries.has('rpm') && <Line type="monotone" dataKey="rpm" stroke="#3b82f6" strokeWidth={1} dot={false} name="RPM" yAxisId={1} animationDuration={300} />}
              {visibleSeries.has('brake') && <Line type="stepAfter" dataKey="brakeVal" stroke="#facc15" strokeWidth={1.5} dot={false} name="Brake" animationDuration={300} />}
              {visibleSeries.has('gear') && <Line type="stepAfter" dataKey="gear" stroke="#a855f7" strokeWidth={1} dot={false} name="Gear" yAxisId={2} animationDuration={300} />}
              {visibleSeries.has('drs') && <Line type="stepAfter" dataKey="drs" stroke="#06b6d4" strokeWidth={1} dot={false} name="DRS" yAxisId={2} animationDuration={300} />}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* DRS + Gear strips (mini timeline bands) */}
      {(visibleSeries.has('drs') || visibleSeries.has('gear')) && viewMode === 'line' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {visibleSeries.has('gear') && (
            <div style={{ flex: 1 }}>
              <div className="text-xs text-silver" style={{ marginBottom: 2 }}>GEAR</div>
              <div style={{ display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden' }}>
                {chartData.slice(-80).map((d, i) => (
                  <div key={i} style={{
                    flex: 1,
                    background: `hsl(${(d.gear || 0) * 35}, 70%, 50%)`,
                    opacity: 0.7,
                  }} title={`Gear ${d.gear}`} />
                ))}
              </div>
            </div>
          )}
          {visibleSeries.has('drs') && (
            <div style={{ flex: 1 }}>
              <div className="text-xs text-silver" style={{ marginBottom: 2 }}>DRS</div>
              <div style={{ display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden' }}>
                {chartData.slice(-80).map((d, i) => (
                  <div key={i} style={{
                    flex: 1,
                    background: d.drs && d.drs > 0 ? '#06b6d4' : 'var(--color-carbon-light)',
                    opacity: d.drs && d.drs > 0 ? 0.9 : 0.3,
                  }} title={d.drs && d.drs > 0 ? 'DRS Open' : 'DRS Closed'} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
