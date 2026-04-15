'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos.' : error.message)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('is_superadmin').eq('id', user.id).single()
      router.push(profile?.is_superadmin ? '/superadmin' : '/admin')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Email */}
      <div>
        <label className="label">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          className="input"
        />
        {errors.email && (
          <p style={{ fontSize: '12px', color: 'var(--lp-danger)', marginTop: '6px' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Senha */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="label" style={{ margin: 0 }}>Senha</label>
          <Link href="/reset-senha" style={{ fontSize: '12px', color: 'var(--lp-violet)', textDecoration: 'none' }}>
            Esqueceu a senha?
          </Link>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            {...register('password')}
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className="input"
            style={{ paddingRight: '44px' }}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--lp-ink-4)', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center' }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p style={{ fontSize: '12px', color: 'var(--lp-danger)', marginTop: '6px' }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center' }}>
        {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={16} />}
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
