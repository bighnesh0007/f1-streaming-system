"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { Search, Users } from 'lucide-react'
import { fetcher, API_DRIVERS } from '@/lib/api'
import { DriverCard } from '@/components/DriverCard'
import Link from 'next/link'

export default function DriversPage() {
  const { data: drivers, error } = useSWR(API_DRIVERS, fetcher)
  const [search, setSearch] = useState('')
  const isLoading = !drivers && !error

  const filtered = (drivers || []).filter((d: any) => {
    const q = search.toLowerCase()
    return !q || d.full_name?.toLowerCase().includes(q)
      || d.name_acronym?.toLowerCase().includes(q)
      || d.team_name?.toLowerCase().includes(q)
      || String(d.driver_number).includes(q)
  })

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Users size={24} color="var(--color-f1-red)" />
          <h2 style={{ fontSize: '1.75rem' }}>Drivers</h2>
        </div>
        <p className="text-sm text-silver">All drivers in the current session</p>
      </header>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--color-silver)' }} />
        <input
          className="search-input"
          placeholder="Search by name, acronym, team, or number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="driver-search"
        />
      </div>

      {/* Grid */}
      <div className="grid-drivers">
        {isLoading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)
        ) : filtered.length === 0 ? (
          <div className="card-premium" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
            <p className="text-silver">No drivers found matching "{search}"</p>
          </div>
        ) : filtered.map((driver: any) => (
          <Link key={driver.driver_number} href={`/drivers/${driver.driver_number}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <DriverCard driver={driver} />
          </Link>
        ))}
      </div>
    </div>
  )
}
