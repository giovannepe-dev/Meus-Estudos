'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader } from 'lucide-react'

interface Props {
  tenantSlug: string
  defaultValue?: string
  categoria?: string
  gcat?: string
  accentColor?: string
}

export function CatalogoSearchInput({ tenantSlug, defaultValue = '', categoria, gcat, accentColor = '#ea580c' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setLoading(true)
    timerRef.current = setTimeout(() => {
      const sp = new URLSearchParams()
      if (categoria) sp.set('categoria', categoria)
      if (gcat) sp.set('gcat', gcat)
      if (value.trim()) sp.set('q', value.trim())
      const qs = sp.toString()
      router.push(`/vitrine/${tenantSlug}/catalogo${qs ? `?${qs}` : ''}`)
      router.refresh()
      setLoading(false)
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <Search size={15} style={{
        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
        color: value ? accentColor : 'var(--lp-ink-4)', pointerEvents: 'none', transition: 'color 200ms',
      }} />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Buscar produtos..."
        style={{
          width: '100%', padding: '10px 40px 10px 36px',
          border: `1.5px solid ${value ? accentColor : 'var(--lp-border)'}`,
          borderRadius: '10px', fontSize: '14px', color: 'var(--lp-ink)',
          backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)',
          outline: 'none', boxSizing: 'border-box', transition: 'border-color 200ms, box-shadow 200ms',
          boxShadow: value ? `0 0 0 3px ${accentColor}18` : 'none',
        }}
      />
      <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {loading && value && <Loader size={13} style={{ color: accentColor, animation: 'spin 1s linear infinite' }} />}
        {value && !loading && (
          <button onClick={() => setValue('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-ink-4)', display: 'flex', padding: '3px', borderRadius: '4px' }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
