'use client'

import { useRouter } from 'next/navigation'

interface Cat { id: string; nome: string; slug: string; emoji?: string | null }

interface Props {
  tenantSlug: string
  tenantCats: Cat[]
  globalCats: Cat[]
  current: string
}

export function MobileFilter({ tenantSlug, tenantCats, globalCats, current }: Props) {
  const router = useRouter()

  const handleChange = (val: string) => {
    if (!val) router.push(`/vitrine/${tenantSlug}/catalogo`)
    else if (val.startsWith('gcat:')) router.push(`/vitrine/${tenantSlug}/catalogo?gcat=${val.slice(5)}`)
    else if (val.startsWith('cat:')) router.push(`/vitrine/${tenantSlug}/catalogo?categoria=${val.slice(4)}`)
  }

  // Find current category display name
  let currentCatName = 'Todas as categorias'
  if (current.startsWith('cat:')) {
    const catSlug = current.slice(4)
    const cat = tenantCats.find(c => c.slug === catSlug)
    if (cat) currentCatName = `${cat.emoji ?? ''} ${cat.nome}`
  } else if (current.startsWith('gcat:')) {
    const catSlug = current.slice(5)
    const cat = globalCats.find(c => c.slug === catSlug)
    if (cat) currentCatName = `${cat.emoji ?? ''} ${cat.nome}`
  }

  return (
    <div className="catalogo-mobile-filter">
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-ink-4)', marginBottom: '8px' }}>
          Categoria
        </p>
        <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)' }}>
          {currentCatName}
        </div>
      </div>
      <select
        value={current}
        onChange={e => handleChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
          background: 'var(--lp-surface)', border: '1.5px solid var(--lp-border)',
          color: 'var(--lp-ink)', outline: 'none', marginBottom: '16px',
        }}
      >
        <option value="">Todas as categorias</option>
        {tenantCats.length > 0 && (
          <optgroup label="Minhas categorias">
            {tenantCats.map(c => <option key={c.id} value={`cat:${c.slug}`}>{c.emoji ?? ''} {c.nome}</option>)}
          </optgroup>
        )}
        {globalCats.length > 0 && (
          <optgroup label="Catálogo CriArt Oficina Digital">
            {globalCats.map(c => <option key={c.id} value={`gcat:${c.slug}`}>{c.emoji ?? ''} {c.nome}</option>)}
          </optgroup>
        )}
      </select>
    </div>
  )
}
