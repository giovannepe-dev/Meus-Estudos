import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { tenant_id } = await req.json()
    if (!tenant_id) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = createAdminClient()
    await supabase.rpc('increment_page_view', { p_tenant_id: tenant_id })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
