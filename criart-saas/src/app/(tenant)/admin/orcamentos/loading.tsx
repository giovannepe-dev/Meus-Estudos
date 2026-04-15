export default function OrcamentosLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ height: '28px', width: '220px', borderRadius: '6px', background: 'var(--lp-surface-2)', marginBottom: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '14px', width: '300px', borderRadius: '4px', background: 'var(--lp-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      {/* Tabs skeleton */}
      <div style={{ height: '40px', width: '340px', borderRadius: '10px', background: 'var(--lp-surface-2)', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      {/* Cards skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card" style={{ marginBottom: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ height: '16px', width: '90px', borderRadius: '4px', background: 'var(--lp-surface-2)' }} />
            <div style={{ height: '16px', width: '50px', borderRadius: '999px', background: 'var(--lp-surface-2)' }} />
          </div>
          <div style={{ height: '12px', width: `${180 + i * 30}px`, borderRadius: '4px', background: 'var(--lp-surface-2)' }} />
        </div>
      ))}
    </div>
  )
}
