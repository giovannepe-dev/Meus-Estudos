'use client'

import { useEffect } from 'react'

export function PageViewTracker({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId }),
    }).catch(() => {})
  }, [tenantId])

  return null
}
