export default function ProdutosLoading() {
  return (
    <div style={{ padding: '32px' }}>
      {/* Header skeleton */}
      <div
        style={{
          height: '28px',
          width: '180px',
          borderRadius: '6px',
          background: 'var(--lp-surface-2)',
          marginBottom: '32px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Table header skeleton */}
      <div
        style={{
          height: '40px',
          borderRadius: '8px',
          background: 'var(--lp-surface-2)',
          marginBottom: '12px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Rows with image placeholders */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '68px',
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
              width: '56px',
              height: '56px',
              borderRadius: '6px',
              background: 'var(--lp-surface-2)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: '14px',
                width: '200px',
                borderRadius: '4px',
                background: 'var(--lp-surface-2)',
                marginBottom: '6px',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '120px',
                borderRadius: '4px',
                background: 'var(--lp-surface-2)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
