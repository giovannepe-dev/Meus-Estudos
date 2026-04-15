'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, Calculator, Package, Clock, DollarSign, ChevronRight } from 'lucide-react'

interface Material {
  id: string
  nome: string
  largura: string
  altura: string
  custo: string
}

const newMaterial = (): Material => ({
  id: crypto.randomUUID(),
  nome: '',
  largura: '',
  altura: '',
  custo: '',
})

export default function OrcamentosPage() {
  const [materiais, setMateriais] = useState<Material[]>([newMaterial()])
  const [minutosMaquina, setMinutosMaquina] = useState('')
  const [valorHora, setValorHora] = useState('120')
  const [outrosCustos, setOutrosCustos] = useState('')
  const [markup, setMarkup] = useState('2.5')

  const addMaterial = () => setMateriais(prev => [...prev, newMaterial()])
  const removeMaterial = (id: string) => setMateriais(prev => prev.filter(m => m.id !== id))
  const updateMaterial = (id: string, field: keyof Material, value: string) =>
    setMateriais(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

  const custoMateriais = materiais.reduce((acc, m) => acc + (parseFloat(m.custo) || 0), 0)
  const custoMaquina = ((parseFloat(minutosMaquina) || 0) / 60) * (parseFloat(valorHora) || 0)
  const custoExtras = parseFloat(outrosCustos) || 0
  const custoTotal = custoMateriais + custoMaquina + custoExtras
  const markupVal = parseFloat(markup) || 1
  const precoSugerido = custoTotal * markupVal
  const lucro = precoSugerido - custoTotal

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #1e1e1e',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#f1f5f9',
    backgroundColor: '#111111',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(241,245,249,.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    display: 'block',
  }

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#0c0c0c',
    border: '1px solid #1e1e1e',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '16px',
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700,
          color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '4px',
        }}>
          Calculadora de Orçamentos
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(241,245,249,.4)' }}>
          Calcule o custo do seu trabalho e encontre o preço de venda ideal
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* LEFT — inputs */}
        <div>
          {/* Materiais */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'rgba(234,88,12,.15)', border: '1px solid rgba(234,88,12,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Package size={16} color="#ea580c" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Materiais</p>
                  <p style={{ fontSize: '12px', color: 'rgba(241,245,249,.4)' }}>Chapas, insumos, consumíveis</p>
                </div>
              </div>
              <button
                onClick={addMaterial}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                  border: '1px solid rgba(234,88,12,.4)', borderRadius: '8px',
                  backgroundColor: 'rgba(234,88,12,.1)', color: '#f97316',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Plus size={13} /> Adicionar
              </button>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 90px 110px 36px',
              gap: '8px', marginBottom: '8px', padding: '0 4px',
            }}>
              {['Material / Descrição', 'Largura (cm)', 'Altura (cm)', 'Custo (R$)', ''].map((h, i) => (
                <span key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(241,245,249,.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {materiais.map((mat, idx) => (
                <div key={mat.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 90px 110px 36px',
                  gap: '8px', alignItems: 'center',
                  padding: '12px', borderRadius: '10px',
                  backgroundColor: '#111111', border: '1px solid #1e1e1e',
                }}>
                  <input type="text" value={mat.nome} onChange={e => updateMaterial(mat.id, 'nome', e.target.value)} placeholder={`Material ${idx + 1}`} style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: '0', fontSize: '13px' }} />
                  <input type="number" value={mat.largura} onChange={e => updateMaterial(mat.id, 'largura', e.target.value)} placeholder="0" min="0" style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: '0', textAlign: 'center' }} />
                  <input type="number" value={mat.altura} onChange={e => updateMaterial(mat.id, 'altura', e.target.value)} placeholder="0" min="0" style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: '0', textAlign: 'center' }} />
                  <input type="number" value={mat.custo} onChange={e => updateMaterial(mat.id, 'custo', e.target.value)} placeholder="0,00" min="0" step="0.01" style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: '0', textAlign: 'right', color: '#f97316', fontWeight: 600 }} />
                  <button onClick={() => removeMaterial(mat.id)} disabled={materiais.length === 1} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '8px', background: 'none', cursor: materiais.length === 1 ? 'default' : 'pointer', color: materiais.length === 1 ? 'rgba(241,245,249,.15)' : 'rgba(239,68,68,.6)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e1e1e' }}>
              <span style={{ fontSize: '13px', color: 'rgba(241,245,249,.5)', marginRight: '12px' }}>Subtotal materiais</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f97316' }}>{fmt(custoMateriais)}</span>
            </div>
          </div>

          {/* Tempo de máquina */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(234,88,12,.15)', border: '1px solid rgba(234,88,12,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color="#ea580c" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Tempo de Máquina</p>
                <p style={{ fontSize: '12px', color: 'rgba(241,245,249,.4)' }}>Laser, CNC, gravação, corte</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Minutos de operação</label>
                <input type="number" value={minutosMaquina} onChange={e => setMinutosMaquina(e.target.value)} placeholder="Ex: 45" min="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor/hora da máquina (R$)</label>
                <input type="number" value={valorHora} onChange={e => setValorHora(e.target.value)} placeholder="120" min="0" step="0.01" style={inputStyle} />
              </div>
            </div>
            {custoMaquina > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e1e1e' }}>
                <span style={{ fontSize: '13px', color: 'rgba(241,245,249,.5)', marginRight: '12px' }}>{minutosMaquina}min × R$ {valorHora}/h</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f97316' }}>{fmt(custoMaquina)}</span>
              </div>
            )}
          </div>

          {/* Outros custos */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(234,88,12,.15)', border: '1px solid rgba(234,88,12,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={16} color="#ea580c" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Outros Custos</p>
                <p style={{ fontSize: '12px', color: 'rgba(241,245,249,.4)' }}>Embalagem, frete, mão de obra extra</p>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Valor (R$)</label>
              <input type="number" value={outrosCustos} onChange={e => setOutrosCustos(e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* RIGHT — summary */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: 'linear-gradient(160deg, #1a0a00 0%, #0c0c0c 100%)', border: '1px solid rgba(234,88,12,.25)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={20} color="white" />
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Resumo do Orçamento</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.7)' }}>Valores calculados em tempo real</p>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Materiais', value: custoMateriais },
                  { label: 'Tempo de máquina', value: custoMaquina },
                  { label: 'Outros custos', value: custoExtras },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(241,245,249,.5)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: value > 0 ? '#f1f5f9' : 'rgba(241,245,249,.25)' }}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(241,245,249,.05)', border: '1px solid rgba(241,245,249,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(241,245,249,.7)' }}>Custo total</span>
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#f1f5f9' }}>{fmt(custoTotal)}</span>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Margem / Markup</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['1.5', '2', '2.5', '3'].map(m => (
                    <button key={m} onClick={() => setMarkup(m)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: markup === m ? '1px solid #ea580c' : '1px solid #1e1e1e', background: markup === m ? 'rgba(234,88,12,.2)' : '#111111', color: markup === m ? '#f97316' : 'rgba(241,245,249,.4)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      {m}x
                    </button>
                  ))}
                </div>
                <input type="number" value={markup} onChange={e => setMarkup(e.target.value)} placeholder="2.5" min="1" step="0.1" style={{ ...inputStyle, marginTop: '8px', textAlign: 'center' }} />
              </div>
              <div style={{ padding: '18px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(234,88,12,.2), rgba(194,65,12,.1))', border: '1px solid rgba(234,88,12,.35)', marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(249,115,22,.7)', marginBottom: '6px' }}>Preço sugerido</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#f97316', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{fmt(precoSugerido)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: 'rgba(241,245,249,.04)', border: '1px solid rgba(241,245,249,.07)' }}>
                <span style={{ fontSize: '12px', color: 'rgba(241,245,249,.45)' }}>Lucro estimado</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: lucro > 0 ? '#4ade80' : '#f87171' }}>{fmt(lucro)}</span>
              </div>
              {custoTotal === 0 && (
                <p style={{ fontSize: '12px', color: 'rgba(241,245,249,.3)', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
                  Preencha os custos ao lado para ver o resumo calculado automaticamente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
