export default function CatalogoLoading() {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
      {/* Sidebar skeleton */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <div
          style={{
            height: '40px',
            borderRadius: '6px',
            background: 'var(--lp-surface-2)',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '36px',
              borderRadius: '6px',
              background: 'var(--lp-surface-2)',
              marginBottom: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* Main content skeleton */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div
          style={{
            height: '28px',
            width: '200px',
            borderRadius: '6px',
            background: 'var(--lp-surface-2)',
            marginBottom: '24px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '220px',
                borderRadius: '8px',
                background: 'var(--lp-surface-2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
