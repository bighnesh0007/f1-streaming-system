"use client"

import React from 'react'
import { User, Flag } from 'lucide-react'

interface DriverCardProps {
  driver: {
    driver_number: number;
    full_name: string;
    name_acronym: string;
    team_name?: string;
    country_code?: string;
    headshot_url?: string;
  };
  isActive?: boolean;
}

export const DriverCard = ({ driver, isActive = false }: DriverCardProps) => {
  return (
    <div className={`card-premium ${isActive ? 'active-border' : ''}`} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem',
      padding: '1rem',
      cursor: 'pointer',
      borderLeft: isActive ? '4px solid var(--color-f1-red)' : '1px solid var(--color-glass-border)'
    }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        borderRadius: '8px', 
        background: 'var(--color-carbon-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {driver.headshot_url ? (
          <img src={driver.headshot_url} alt={driver.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <User size={24} color="var(--color-silver)" />
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>
          {driver.full_name} <span style={{ color: 'var(--color-f1-red)', fontSize: '0.75rem' }}>#{driver.driver_number}</span>
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {driver.team_name || 'Individual'} 
          {driver.country_code && <span title={driver.country_code}><Flag size={12} /></span>}
        </p>
      </div>

      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-glass-border)' }}>
        {driver.name_acronym}
      </div>

      <style jsx>{`
        .active-border {
          background: rgba(225, 6, 0, 0.05) !important;
          border-color: rgba(225, 6, 0, 0.3) !important;
        }
      `}</style>
    </div>
  )
}
