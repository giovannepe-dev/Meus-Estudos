import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUSPENDED_STATUSES = ['suspended']

export async function proxy(request: NextRequest) {
  let res = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(s) {
          s.forEach(({ name, value }) => request.cookies.set(name, value))
          res = NextResponse.next({ request })
          s.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Vitrine: bloqueia se tenant suspenso ──────────────────────────────────
  const vitrineMatch = pathname.match(/^\/vitrine\/([^/]+)/)
  if (vitrineMatch && !pathname.includes('/suspenso')) {
    const slug = vitrineMatch[1]
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status, name')
      .eq('slug', slug)
      .single()
    if (tenant && SUSPENDED_STATUSES.includes(tenant.status)) {
      return NextResponse.redirect(new URL(`/vitrine/${slug}/suspenso`, request.url))
    }
  }

  // ── Admin: bloqueia se tenant do usuário suspenso ─────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: tu } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants(status, is_trial)')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single()
    if (!tu) return NextResponse.redirect(new URL('/login?error=no-tenant', request.url))
    const tenantData = tu.tenants as any
    const status = tenantData?.status
    if (status && SUSPENDED_STATUSES.includes(status)) {
      const isTrial = tenantData?.is_trial === true
      const url = new URL('/acesso-suspenso', request.url)
      if (isTrial) url.searchParams.set('trial', '1')
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/superadmin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: p } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
    if (!p?.is_superadmin) return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }

  if (pathname === '/login' && user) {
    const { data: p } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
    return NextResponse.redirect(new URL(p?.is_superadmin ? '/superadmin' : '/admin', request.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
