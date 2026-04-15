export default function VitrineLoading() {
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

      {/* Card sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            marginBottom: '16px',
            borderRadius: '8px',
            border: '1px solid var(--lp-border)',
            padding: '16px',
            background: 'var(--lp-surface)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              height: '20px',
              width: '150px',
              borderRadius: '4px',
              background: 'var(--lp-surface-2)',
              marginBottom: '12px',
            }}
          />
          <div
            style={{
              height: '16px',
              width: '100%',
              borderRadius: '4px',
              background: 'var(--lp-surface-2)',
            }}
          />
        </div>
      ))}
    </div>
  )
}
