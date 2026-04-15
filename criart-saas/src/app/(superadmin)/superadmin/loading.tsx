export default function SuperadminLoading() {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ height: '28px', width: '220px', borderRadius: '6px', background: 'var(--lp-surface-2)', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '16px', width: '160px', borderRadius: '4px', background: 'var(--lp-surface-2)', marginBottom: '32px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ height: '64px', marginBottom: '8px', borderRadius: '10px', background: 'var(--lp-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}
