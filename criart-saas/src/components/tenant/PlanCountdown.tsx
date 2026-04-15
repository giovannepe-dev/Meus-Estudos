'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  expiresAt: string
}

export function PlanCountdown({ expiresAt }: Props) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = expires.getTime() - now.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      setDaysRemaining(days)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Atualizar a cada minuto
    return () => clearInterval(interval)
  }, [expiresAt])

  if (daysRemaining === null) return null

  const isExpired = daysRemaining <= 0
  const isUrgent = daysRemaining <= 7
  const isWarning = daysRemaining <= 30

  const bgColor = isExpired ? 'var(--lp-red)' : isUrgent ? 'var(--lp-amber)' : isWarning ? 'var(--lp-amber-pale)' : 'var(--lp-surface)'
  const textColor = isExpired ? 'white' : isUrgent ? 'white' : 'var(--lp-ink)'
  const borderColor = isExpired ? 'var(--lp-red)' : isUrgent ? 'var(--lp-amber)' : 'var(--lp-amber-pale)'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '16px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 40,
        maxWidth: '280px',
      }}
    >
      <AlertCircle size={20} style={{ color: textColor, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, color: textColor, margin: 0 }}>
          {isExpired ? 'Plano Expirado' : `${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`}
        </p>
        {!isExpired && (
          <p style={{ fontSize: '11px', color: textColor, opacity: 0.8, margin: '2px 0 0 0' }}>
            {isUrgent ? 'Renovar em breve' : 'Renovação em breve'}
          </p>
        )}
      </div>
    </div>
  )
}
