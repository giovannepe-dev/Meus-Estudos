'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader } from 'lucide-react'

interface Props {
  tenantSlug: string
  accentColor: string
  placeholder?: string
}

export function StorefrontSearchBar({ tenantSlug, accentColor, placeholder = 'Buscar produtos...' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) { setLoading(false); return }

    setLoading(true)
    timerRef.current = setTimeout(() => {
      router.push(`/vitrine/${tenantSlug}/catalogo?q=${encodeURIComponent(value.trim())}`)
      router.refresh()
      setLoading(false)
    }, 400)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value, tenantSlug, router])

  return (
    <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <Search size={18} style={{
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        color: value ? accentColor : 'var(--lp-ink-4)', pointerEvents: 'none', transition: 'color 200ms',
      }} />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '15px 48px 15px 50px',
          border: `2px solid ${value ? accentColor : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '16px', fontSize: '15px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' as const,
          transition: 'border-color 200ms, box-shadow 200ms',
          boxShadow: value ? `0 0 0 4px ${accentColor}22` : '0 4px 24px rgba(0,0,0,0.2)',
          color: 'white',
        }}
      />
      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {loading && <Loader size={15} style={{ color: accentColor, animation: 'spin 1s linear infinite' }} />}
        {value && !loading && (
          <button onClick={() => setValue('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '4px', borderRadius: '4px' }}>
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
