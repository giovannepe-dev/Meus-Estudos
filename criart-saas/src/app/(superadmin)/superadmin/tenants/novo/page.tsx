import { CriarEmpresaClient } from './CriarEmpresaClient'

interface Props { searchParams: Promise<{ nome?: string; email?: string }> }

export default async function CriarEmpresaPage({ searchParams }: Props) {
  const { nome, email } = await searchParams
  return <CriarEmpresaClient initialNome={nome ?? ''} initialEmail={email ?? ''} />
}
