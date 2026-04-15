'use client'
import { useState, useEffect } from 'react'
export function useDebounce<T>(value: T, delay = 400): T {
  const [d, setD] = useState<T>(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}
