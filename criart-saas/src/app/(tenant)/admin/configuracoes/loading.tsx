export default function ConfiguracoesLoading() {
  return (
    <div style={{ padding: '32px' }}>
      {/* Header skeleton */}
      <div
        style={{
          height: '28px',
          width: '220px',
          borderRadius: '6px',
          background: 'var(--lp-surface-2)',
          marginBottom: '32px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Tab bar skeleton */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '36px',
              width: '100px',
              borderRadius: '6px',
              background: 'var(--lp-surface-2)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* Form fields skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ marginBottom: '20px' }}>
          <div
            style={{
              height: '14px',
              width: '120px',
              borderRadius: '4px',
              background: 'var(--lp-surface-2)',
              marginBottom: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '40px',
              borderRadius: '6px',
              background: 'var(--lp-surface-2)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </div>
  )
}
