"use client"
import React from 'react'
import useSWR from 'swr'
import { fetcher, API_SESSIONS } from '@/lib/api'

interface SessionSelectorProps {
  value: number | null;
  onChange: (sessionId: number | null) => void;
}

export function SessionSelector({ value, onChange }: SessionSelectorProps) {
  const { data: sessions } = useSWR(API_SESSIONS, fetcher)

  return (
    <select
      className="select-premium"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
    >
      <option value="">Latest Session</option>
      {(sessions || []).map((s: any) => (
        <option key={s.id} value={s.id}>
          {s.session_name || s.session_type || 'Session'} — {s.circuit_name || s.country || `Key: ${s.session_key}`}
        </option>
      ))}
    </select>
  )
}
