import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Pegar o tenant do usuário
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single()

    if (!tenantUser) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Somente imagens são permitidas' }, { status: 400 })
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem deve ter menos de 2MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const filePath = `${tenantUser.tenant_id}/logo.${ext}`
    const buffer = await file.arrayBuffer()

    const adminSupabase = createAdminClient()

    // Upload para o bucket tenant-assets
    const { error: uploadError } = await adminSupabase.storage
      .from('tenant-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      // Tentar criar o bucket se não existir
      if (uploadError.message.includes('Bucket not found')) {
        await adminSupabase.storage.createBucket('tenant-assets', { public: true })
        await adminSupabase.storage
          .from('tenant-assets')
          .upload(filePath, buffer, { contentType: file.type, upsert: true })
      } else {
        return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 400 })
      }
    }

    // Pegar URL pública
    const { data: urlData } = adminSupabase.storage
      .from('tenant-assets')
      .getPublicUrl(filePath)

    // Atualizar tenant_settings com a nova logo_url
    await supabase
      .from('tenant_settings')
      .update({ logo_url: urlData.publicUrl })
      .eq('tenant_id', tenantUser.tenant_id)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro interno no upload' }, { status: 500 })
  }
}
