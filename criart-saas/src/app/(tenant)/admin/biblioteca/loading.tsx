export default function BibliotecaLoading() {
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

      {/* Stats skeleton - 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '100px',
              borderRadius: '8px',
              background: 'var(--lp-surface)',
              border: '1px solid var(--lp-border)',
              padding: '16px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            <div
              style={{
                height: '12px',
                width: '80px',
                borderRadius: '4px',
                background: 'var(--lp-surface-2)',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                height: '20px',
                width: '40px',
                borderRadius: '4px',
                background: 'var(--lp-surface-2)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Accordion categories */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            marginBottom: '8px',
            borderRadius: '8px',
            border: '1px solid var(--lp-border)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              height: '48px',
              background: 'var(--lp-surface)',
              borderRadius: '8px',
              padding: '12px 16px',
            }}
          />
        </div>
      ))}
    </div>
  )
}
