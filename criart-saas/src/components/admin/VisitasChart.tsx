interface DataPoint { date: string; views: number }

interface Props { data: DataPoint[] }

function pad2(n: number) { return n.toString().padStart(2, '0') }

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  })
}

export function VisitasChart({ data }: Props) {
  const days = getLast7Days()
  const map = Object.fromEntries(data.map(d => [d.date, d.views]))
  const points = days.map(d => ({ date: d, views: map[d] ?? 0 }))
  const max = Math.max(...points.map(p => p.views), 1)
  const total = points.reduce((s, p) => s + p.views, 0)
  const hoje = points[points.length - 1].views

  const W = 560, H = 100, PAD = 4
  const step = (W - PAD * 2) / (points.length - 1)

  const toX = (i: number) => PAD + i * step
  const toY = (v: number) => H - PAD - ((v / max) * (H - PAD * 2))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.views).toFixed(1)}`).join(' ')
  const areaD = `${pathD} L${toX(points.length - 1).toFixed(1)},${H} L${toX(0).toFixed(1)},${H} Z`

  const fmtDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Visitas — últimos 7 dias
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--lp-ink)', marginTop: '4px' }}>
            {total.toLocaleString('pt-BR')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)' }}>Hoje</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lp-violet)' }}>{hoje}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '80px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="vis-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lp-violet)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--lp-violet)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#vis-grad)" />
        <path d={pathD} fill="none" stroke="var(--lp-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.views)} r="3"
            fill={p.views > 0 ? 'var(--lp-violet)' : 'var(--lp-border)'}
            stroke="var(--lp-surface)" strokeWidth="2" />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {points.map((p, i) => (
          <span key={i} style={{ fontSize: '10px', color: 'var(--lp-ink-4)', textAlign: 'center', flex: 1 }}>
            {fmtDay(p.date)}
          </span>
        ))}
      </div>
    </div>
  )
}
