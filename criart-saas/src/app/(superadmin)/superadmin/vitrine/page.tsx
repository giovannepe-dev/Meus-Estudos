import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Sparkles, FolderOpen, Package } from 'lucide-react'

export default async function SuperadminVitrinePage() {
  const db = createAdminClient()

  const { data: categorias } = await db
    .from('global_categories')
    .select('id, nome, slug')
    .order('nome')

  if (!categorias || categorias.length === 0) {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Vitrine Global
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '40px' }}>
          Prévia do catálogo universal
        </p>
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Package size={48} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', color: 'var(--lp-ink-3)' }}>
            Nenhum produto ainda. Envie fotos pelo bot do Telegram para começar.
          </p>
        </div>
      </div>
    )
  }

  // Buscar produtos por categoria (máx 12 por categoria)
  const sections = await Promise.all(
    categorias.map(async (cat) => {
      const { data: produtos } = await db
        .from('global_products')
        .select('id, nome, imagem_url, novidade, destaque')
        .eq('categoria_id', cat.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(12)
      return { ...cat, produtos: produtos ?? [] }
    })
  )

  // Novidades (todos produtos com novidade=true, máx 16)
  const { data: novidades } = await db
    .from('global_products')
    .select('id, nome, imagem_url, categoria:global_categories(nome)')
    .eq('ativo', true)
    .eq('novidade', true)
    .order('created_at', { ascending: false })
    .limit(16)

  const totalProdutos = sections.reduce((acc, s) => acc + s.produtos.length, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Vitrine Global
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
            {categorias.length} categorias · {totalProdutos} produtos visíveis
          </p>
        </div>
        <Link
          href="/superadmin/produtos"
          style={{
            padding: '9px 16px', backgroundColor: 'var(--lp-violet)', color: 'white',
            textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          }}
        >
          Gerenciar produtos
        </Link>
      </div>

      {/* Novidades */}
      {novidades && novidades.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: 'var(--lp-violet)' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)' }}>
              Novidades
            </h2>
            <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: 'var(--lp-violet-pale)', color: 'var(--lp-violet)' }}>
              {novidades.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {novidades.map(p => (
              <ProductThumb key={p.id} produto={p} showCategory />
            ))}
          </div>
        </section>
      )}

      {/* Categorias */}
      {sections.filter(s => s.produtos.length > 0).map(section => (
        <section key={section.id} style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={16} style={{ color: 'var(--lp-violet)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)' }}>
                {section.nome}
              </h2>
              <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: 'var(--lp-surface-2)', color: 'var(--lp-ink-4)' }}>
                {section.produtos.length}{section.produtos.length === 12 ? '+' : ''}
              </span>
            </div>
            <Link
              href={`/superadmin/produtos?cat=${section.id}`}
              style={{ fontSize: '12px', color: 'var(--lp-violet)', textDecoration: 'none', fontWeight: 500 }}
            >
              Ver todos →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {section.produtos.map((p: any) => (
              <ProductThumb key={p.id} produto={p} />
            ))}
          </div>
        </section>
      ))}

      {/* Categorias vazias */}
      {sections.filter(s => s.produtos.length === 0).length > 0 && (
        <section style={{ marginTop: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginBottom: '8px' }}>
            Categorias sem produtos ativos:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {sections.filter(s => s.produtos.length === 0).map(s => (
              <span key={s.id} style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', backgroundColor: 'var(--lp-surface-2)', color: 'var(--lp-ink-4)' }}>
                {s.nome}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ProductThumb({ produto, showCategory }: { produto: any; showCategory?: boolean }) {
  return (
    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--lp-border)', background: 'var(--lp-surface)' }}>
      <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--lp-surface-2)' }}>
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} style={{ color: 'var(--lp-ink-4)' }} />
          </div>
        )}
        {produto.novidade && (
          <span style={{
            position: 'absolute', top: '6px', left: '6px',
            padding: '2px 6px', borderRadius: '999px', fontSize: '9px', fontWeight: 700,
            backgroundColor: 'var(--lp-violet)', color: 'white',
          }}>NOVO</span>
        )}
        {produto.destaque && (
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            padding: '2px 6px', borderRadius: '999px', fontSize: '9px', fontWeight: 700,
            backgroundColor: '#F59E0B', color: 'white',
          }}>★</span>
        )}
      </div>
      <div style={{ padding: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--lp-ink)', lineHeight: '1.3',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {produto.nome}
        </p>
        {showCategory && produto.categoria && (
          <p style={{ fontSize: '10px', color: 'var(--lp-ink-4)', marginTop: '2px' }}>{produto.categoria.nome}</p>
        )}
      </div>
    </div>
  )
}
