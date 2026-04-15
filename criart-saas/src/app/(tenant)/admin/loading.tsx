export default function AdminLoading() {
  return (
    <div style={{ padding: '32px' }}>
      {/* Page title skeleton */}
      <div
        style={{
          height: '28px',
          width: '220px',
          borderRadius: '6px',
          background: 'var(--lp-surface-2)',
          marginBottom: '8px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: '16px',
          width: '160px',
          borderRadius: '4px',
          background: 'var(--lp-surface-2)',
          marginBottom: '32px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '72px',
            marginBottom: '8px',
            borderRadius: '10px',
            background: 'var(--lp-surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}
