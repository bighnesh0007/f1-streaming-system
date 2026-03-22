"use client"
import React from 'react'
import useSWR from 'swr'
import { fetcher, getRaceControlUrl } from '@/lib/api'
import { AlertTriangle, Flag, Info } from 'lucide-react'

export function RaceControlFeed({ sessionId }: { sessionId?: number | null }) {
  const { data: messages } = useSWR(getRaceControlUrl(sessionId || undefined), fetcher, { refreshInterval: 5000 })

  if (!messages || messages.length === 0) return (
    <div className="card-premium" style={{ padding: '1rem' }}>
      <h3 className="text-xs text-silver" style={{ marginBottom: '0.75rem' }}>RACE CONTROL</h3>
      <p className="text-silver text-xs">No active messages</p>
    </div>
  )

  return (
    <div className="card-premium" style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
      <h3 className="text-xs text-silver" style={{ marginBottom: '0.75rem' }}>RACE CONTROL FEED</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ marginTop: '0.2rem' }}>
              {msg.flag === 'RED' ? <Flag size={16} color="var(--color-f1-red)" /> : 
               msg.flag === 'YELLOW' ? <Flag size={16} color="var(--color-yellow)" /> :
               <AlertTriangle size={16} color="var(--color-silver)" />}
            </div>
            <div>
              <div className="text-xs text-silver" style={{ marginBottom: '0.2rem' }}>
                {new Date(msg.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-sm" style={{ lineHeight: 1.4 }}>{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
