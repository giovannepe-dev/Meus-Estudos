'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'

interface Props {
  products: any[]
  tenantSlug: string
  accentColor: string
  mostrarPreco: boolean
}

const GAP = 12

export function ProductCarousel({ products, tenantSlug, accentColor, mostrarPreco }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const hoveredRef = useRef(false)
  const pausedRef  = useRef(false)
  const isVisibleRef = useRef(false)  // Track if carousel is in viewport
  const posRef     = useRef(0)
  const maxPosRef  = useRef(0)
  const itemWRef   = useRef(0)
  const animRef    = useRef<number | undefined>(undefined)
  const dragRef    = useRef({ active: false, startX: 0, startY: 0, startPos: 0 })

  // React state for arrows — only updated when value changes (not every frame)
  const showLeftRef  = useRef(false)
  const showRightRef = useRef(false)
  const [showLeft,  setShowLeft]  = useState(false)
  const [showRight, setShowRight] = useState(true)  // assume scrollable until measured
  const [itemWidth, setItemWidth] = useState(0)

  const setArrows = useCallback((pos: number) => {
    const newLeft  = pos > 1
    const newRight = maxPosRef.current > 0 && pos < maxPosRef.current - 1
    if (newLeft  !== showLeftRef.current)  { showLeftRef.current  = newLeft;  setShowLeft(newLeft) }
    if (newRight !== showRightRef.current) { showRightRef.current = newRight; setShowRight(newRight) }
  }, [])

  const applyPos = useCallback((p: number) => {
    const clamped  = Math.max(0, Math.min(maxPosRef.current, p))
    posRef.current = clamped
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${clamped}px)`
    setArrows(clamped)
  }, [setArrows])

  /* ── Measure ── */
  const measure = useCallback(() => {
    if (!wrapRef.current) return
    const cw = wrapRef.current.clientWidth
    if (cw === 0) return
    // More responsive: 2 on mobile, 3 on tablet, 4 on desktop
    const visible = window.innerWidth <= 640 ? 2 : window.innerWidth <= 1024 ? 3 : 4
    const iw = Math.floor((cw - GAP * (visible - 1)) / visible)
    const mx = Math.max(0, products.length * (iw + GAP) - GAP - cw)
    itemWRef.current  = iw
    maxPosRef.current = mx
    setItemWidth(iw)
    setArrows(posRef.current)
  }, [products.length, setArrows])

  useEffect(() => {
    let retries = 0
    const tryMeasure = () => {
      if (wrapRef.current && wrapRef.current.clientWidth > 0) {
        measure()
      } else if (retries < 20) {
        retries++
        setTimeout(tryMeasure, 50)
      }
    }
    requestAnimationFrame(tryMeasure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  /* ── Visibility detection ── */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* ── Auto-scroll ── */
  useEffect(() => {
    const animate = () => {
      if (isVisibleRef.current && !pausedRef.current && maxPosRef.current > 0) {
        const next = posRef.current + (hoveredRef.current ? 0.15 : 0.6)
        applyPos(next >= maxPosRef.current ? 0 : next)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [applyPos])

  /* ── Drag helpers ── */
  const onDragStart = useCallback((clientX: number, clientY: number) => {
    pausedRef.current = true
    dragRef.current   = { active: true, startX: clientX, startY: clientY, startPos: posRef.current }
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing'
  }, [])

  const onDragMove = useCallback((clientX: number) => {
    if (!dragRef.current.active) return
    applyPos(dragRef.current.startPos + (dragRef.current.startX - clientX))
  }, [applyPos])

  const onDragEnd = useCallback(() => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    if (trackRef.current) trackRef.current.style.cursor = 'grab'
    setTimeout(() => { pausedRef.current = false }, 1500)
  }, [])

  /* ── Global mouse listeners ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => onDragMove(e.clientX)
    const onUp   = () => onDragEnd()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [onDragMove, onDragEnd])

  /* ── Touch listeners (non-passive for preventDefault) ── */
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onTouchStart = (e: TouchEvent) => onDragStart(e.touches[0].clientX, e.touches[0].clientY)
    const onTouchMove  = (e: TouchEvent) => {
      if (!dragRef.current.active) return
      const dx = Math.abs(e.touches[0].clientX - dragRef.current.startX)
      const dy = Math.abs(e.touches[0].clientY - dragRef.current.startY)
      if (dx > dy) { e.preventDefault(); onDragMove(e.touches[0].clientX) }
      else dragRef.current.active = false
    }
    const onTouchEnd = () => onDragEnd()
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onDragStart, onDragMove, onDragEnd])

  /* ── Arrow click ── */
  const scrollStep = (dir: 'left' | 'right') => {
    pausedRef.current = true
    const step   = (itemWRef.current + GAP) * 2
    const target = dir === 'right'
      ? Math.min(maxPosRef.current, posRef.current + step)
      : Math.max(0, posRef.current - step)
    const start = posRef.current, dist = target - start, t0 = performance.now()
    const ease  = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const run   = (now: number) => {
      const p = Math.min((now - t0) / 350, 1)
      applyPos(start + dist * ease(p))
      if (p < 1) requestAnimationFrame(run)
      else setTimeout(() => { pausedRef.current = false }, 2500)
    }
    requestAnimationFrame(run)
  }

  const arrowStyle: CSSProperties = {
    position: 'absolute', top: '40%', transform: 'translateY(-50%)', zIndex: 10,
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)', border: '1px solid var(--lp-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', overflow: 'hidden', userSelect: 'none' }}
      onMouseEnter={() => { hoveredRef.current = true }}
      onMouseLeave={() => { hoveredRef.current = false }}
    >
      {showLeft && (
        <button onClick={() => scrollStep('left')} style={{ ...arrowStyle, left: '4px' }}>
          <ChevronLeft size={16} color="var(--lp-ink-2)" />
        </button>
      )}

      <div
        ref={trackRef}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
        style={{ display: 'flex', gap: `${GAP}px`, willChange: 'transform', cursor: 'grab' }}
      >
        {itemWidth > 0 && products.map((p: any) => (
          <div key={`${p.source ?? ''}-${p.id}`} style={{ width: itemWidth, flexShrink: 0 }}>
            <ProductCard product={p} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={mostrarPreco} />
          </div>
        ))}
      </div>

      {showRight && (
        <button onClick={() => scrollStep('right')} style={{ ...arrowStyle, right: '4px' }}>
          <ChevronRight size={16} color="var(--lp-ink-2)" />
        </button>
      )}
    </div>
  )
}
