"use client"
import React from 'react'
import useSWR from 'swr'
import { fetcher, API_WEATHER_LATEST } from '@/lib/api'
import { CloudRain, Thermometer, Wind } from 'lucide-react'

export function WeatherWidget() {
  const { data } = useSWR(API_WEATHER_LATEST, fetcher, { refreshInterval: 10000 })

  if (!data) return (
    <div className="card-premium" style={{ padding: '1rem' }}>
      <h3 className="text-xs text-silver" style={{ marginBottom: '0.75rem' }}>WEATHER</h3>
      <p className="text-silver text-xs">No weather data</p>
    </div>
  )

  return (
    <div className="card-premium" style={{ padding: '1rem' }}>
      <h3 className="text-xs text-silver" style={{ marginBottom: '0.75rem' }}>TRACK CONDITIONS</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Thermometer size={16} color="var(--color-f1-red)" />
          <div>
            <div className="text-xs text-silver">AIR</div>
            <div style={{ fontWeight: 700 }}>{data.air_temperature ?? '--'}°C</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Thermometer size={16} color="var(--color-yellow)" />
          <div>
            <div className="text-xs text-silver">TRACK</div>
            <div style={{ fontWeight: 700 }}>{data.track_temperature ?? '--'}°C</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CloudRain size={16} color="var(--color-blue)" />
          <div>
            <div className="text-xs text-silver">RAIN</div>
            <div style={{ fontWeight: 700 }}>{data.rainfall ? 'WET' : 'DRY'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wind size={16} color="var(--color-silver)" />
          <div>
            <div className="text-xs text-silver">WIND</div>
            <div style={{ fontWeight: 700 }}>{data.wind_speed ?? '--'} m/s</div>
          </div>
        </div>
      </div>
    </div>
  )
}
