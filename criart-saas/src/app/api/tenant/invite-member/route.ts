import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { email, password, nome, role, tenantId } = await req.json()

    if (!email || !password || !tenantId) {
      return NextResponse.json({ error: 'E-mail, senha e empresa são obrigatórios' }, { status: 400 })
    }

    // Verificar se o usuário que está convidando é admin do tenant
    const { data: callerRole } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .single()

    if (!callerRole || callerRole.role !== 'tenant_admin') {
      return NextResponse.json({ error: 'Sem permissão para convidar membros' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    let userId: string

    // Criar usuário (ou recuperar o existente)
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nome || '' },
    })

    if (createError) {
      if (createError.message.toLowerCase().includes('already')) {
        // Usuário já existe — buscar pelo email
        const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()
        if (listError) return NextResponse.json({ error: 'Erro ao buscar usuário existente' }, { status: 400 })
        const existing = users.find(u => u.email === email)
        if (!existing) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        userId = existing.id
      } else {
        return NextResponse.json({ error: 'Erro ao criar usuário: ' + createError.message }, { status: 400 })
      }
    } else {
      userId = newUser.user.id
      await adminSupabase.from('profiles').upsert({ id: userId, full_name: nome || '' })
    }

    // Verificar se já é membro deste tenant
    const { data: existingMember } = await adminSupabase
      .from('tenant_users')
      .select('id, ativo')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (existingMember) {
      if (existingMember.ativo) {
        return NextResponse.json({ error: 'Este usuário já é membro desta empresa' }, { status: 409 })
      }
      // Reativar membro inativo
      await adminSupabase.from('tenant_users')
        .update({ ativo: true, role: role || 'tenant_staff' })
        .eq('id', existingMember.id)
      return NextResponse.json({ userId })
    }

    // Vincular ao tenant
    const { error: linkError } = await adminSupabase.from('tenant_users').insert({
      user_id: userId,
      tenant_id: tenantId,
      role: role || 'tenant_staff',
      ativo: true,
    })

    if (linkError) {
      return NextResponse.json({ error: 'Erro ao vincular membro: ' + linkError.message }, { status: 400 })
    }

    return NextResponse.json({ userId })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Erro interno ao convidar membro' }, { status: 500 })
  }
}
