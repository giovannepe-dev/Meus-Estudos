import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()

    // Trocar código por sessão
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (!sessionError) {
      // Redirecionar conforme o tipo
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/nova-senha', requestUrl.origin))
      }

      // Fallback: para outros tipos, vai para admin
      return NextResponse.redirect(new URL('/admin', requestUrl.origin))
    }
  }

  // Se houver erro, redireciona para login
  return NextResponse.redirect(new URL('/login?error=invalid_recovery_link', requestUrl.origin))
}
