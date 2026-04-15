export default function VitrineStorefrontLoading() {
  return (
    <div>
      {/* Hero section skeleton */}
      <div
        style={{
          height: '400px',
          background: 'var(--lp-surface-2)',
          animation: 'pulse 1.5s ease-in-out infinite',
          marginBottom: '40px',
        }}
      />

      {/* Categories grid skeleton */}
      <div style={{ padding: '0 16px', marginBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '100px',
                borderRadius: '8px',
                background: 'var(--lp-surface-2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>

      {/* Product sections */}
      {Array.from({ length: 2 }).map((_, sectionIdx) => (
        <div key={sectionIdx} style={{ padding: '0 16px', marginBottom: '40px' }}>
          <div
            style={{
              height: '24px',
              width: '200px',
              borderRadius: '4px',
              background: 'var(--lp-surface-2)',
              marginBottom: '16px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '200px',
                  borderRadius: '8px',
                  background: 'var(--lp-surface-2)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
