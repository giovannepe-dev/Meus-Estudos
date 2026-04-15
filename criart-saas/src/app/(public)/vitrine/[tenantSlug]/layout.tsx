export const dynamic = 'force-dynamic' // sempre fresh, sem cache ISR

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/supabase/queries'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter'
import { StorefrontMobileBar } from '@/components/storefront/StorefrontMobileBar'
import { PageViewTracker } from '@/components/storefront/PageViewTracker'

interface Props { params: Promise<{ tenantSlug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { tenantSlug } = await params
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return {}
  const settings = (tenant as any).settings
  const nomeSite = settings?.nome_site ?? tenant.name
  const descricao = settings?.descricao ?? `Catálogo de produtos de ${nomeSite}`
  const logo = settings?.logo_url ?? null
  return {
    title: { default: nomeSite, template: `%s — ${nomeSite}` },
    description: descricao,
    openGraph: {
      siteName: nomeSite,
      description: descricao,
      images: logo ? [{ url: logo }] : [],
    },
  }
}

export default async function StorefrontLayout({ params, children }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantBySlug(tenantSlug)

  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'

  return (
    <>
      <style>{`:root { --tenant-accent: ${accentColor}; --tenant-accent-pale: ${accentColor}18; } .cat-card:hover > div { background: var(--lp-surface) !important; } .cat-card > div { transition: background 200ms; }`}</style>
      <div className="storefront-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white', overflowX: 'hidden' }}>
        <PageViewTracker tenantId={tenant.id} />
        <StorefrontHeader tenant={tenant} settings={settings} tenantSlug={tenantSlug} />
        <main style={{ flex: 1, paddingBottom: 'calc(100px + max(70px, env(safe-area-inset-bottom)))' }}>{children}</main>
        <StorefrontFooter settings={settings} tenantSlug={tenantSlug} />
        <StorefrontMobileBar tenantSlug={tenantSlug} settings={settings} tenant={tenant} accentColor={accentColor} />
      </div>
    </>
  )
}
