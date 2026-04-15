export default function CategoriasLoading() {
  return (
    <div style={{ padding: '32px' }}>
      {/* Header skeleton */}
      <div
        style={{
          height: '28px',
          width: '200px',
          borderRadius: '6px',
          background: 'var(--lp-surface-2)',
          marginBottom: '32px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Rows with icon placeholders */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '56px',
            padding: '12px',
            marginBottom: '8px',
            borderRadius: '8px',
            background: 'var(--lp-surface)',
            border: '1px solid var(--lp-border)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '6px',
              background: 'var(--lp-surface-2)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: '14px',
                width: '150px',
                borderRadius: '4px',
                background: 'var(--lp-surface-2)',
              }}
            />
          </div>
          <div
            style={{
              width: '40px',
              height: '24px',
              borderRadius: '12px',
              background: 'var(--lp-surface-2)',
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </div>
  )
}
