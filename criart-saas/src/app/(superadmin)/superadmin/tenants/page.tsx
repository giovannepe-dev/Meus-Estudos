import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Plus, Building2 } from 'lucide-react'

const statusLabel: Record<string, string> = { active: 'Ativa', trial: 'Trial', inactive: 'Inativa', suspended: 'Suspensa' }
const statusColor: Record<string, string> = { active: 'var(--lp-success)', trial: 'var(--lp-amber)', inactive: 'var(--lp-ink-4)', suspended: 'var(--lp-red)' }
const statusBg: Record<string, string> = { active: 'var(--lp-success-pale)', trial: 'var(--lp-amber-pale)', suspended: 'var(--lp-red-pale)', inactive: 'var(--lp-surface-2)' }

function daysRemaining(expiresAt: string | null): number {
  if (!expiresAt) return -1
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
}

export default async function TenantsPage() {
  const supabase = await createClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, settings:tenant_settings(nome_site, logo_url, cor_destaque)')
    .order('created_at', { ascending: false })

  const list = tenants ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Empresas
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            {list.length} empresa{list.length !== 1 ? 's' : ''} cadastrada{list.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/superadmin/tenants/novo" style={{ textDecoration: 'none' }}>
          <button className="btn-primary"><Plus size={16} /> Nova Empresa</button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Building2 size={36} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '20px' }}>
            Nenhuma empresa cadastrada ainda
          </p>
          <Link href="/superadmin/tenants/novo" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">Cadastrar Primeira Empresa</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {list.map((tenant: any) => {
            const remaining = daysRemaining(tenant.plan_expires_at)
            const nome = tenant.settings?.nome_site || tenant.name
            return (
              <Link key={tenant.id} href={`/superadmin/tenants/${tenant.id}`} style={{ textDecoration: 'none' }}>
                <div className="card tenant-row" style={{
                  padding: '14px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto auto',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: tenant.settings?.cor_destaque || 'var(--lp-violet)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: 'white',
                  }}>
                    {nome.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nome}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginTop: '1px' }}>/{tenant.slug}</p>
                  </div>

                  <div style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
                    backgroundColor: statusBg[tenant.status] ?? 'var(--lp-surface-2)',
                    color: statusColor[tenant.status] ?? 'var(--lp-ink-3)',
                  }}>
                    {statusLabel[tenant.status] ?? tenant.status}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--lp-ink-3)', textAlign: 'right', minWidth: '110px' }}>
                    <p style={{ fontWeight: 600, color: 'var(--lp-ink-2)' }}>{tenant.plan_days} dias</p>
                    <p style={{ marginTop: '2px', color: remaining < 0 ? 'var(--lp-red)' : remaining <= 7 ? 'var(--lp-red)' : remaining <= 30 ? 'var(--lp-amber)' : 'var(--lp-success)' }}>
                      {remaining < 0 ? 'Expirado' : `${remaining} restantes`}
                    </p>
                  </div>

                  <ArrowRight size={15} style={{ color: 'var(--lp-ink-4)' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
