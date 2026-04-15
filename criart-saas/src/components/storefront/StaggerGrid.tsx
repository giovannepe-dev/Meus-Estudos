'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function StaggerGrid({ children, className = '', style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const items = container.querySelectorAll<HTMLElement>(':scope > *')
          items.forEach((item, i) => {
            item.style.opacity = '0'
            item.style.transform = 'translateY(20px)'
            item.style.transition = `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms`
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                item.style.opacity = '1'
                item.style.transform = 'translateY(0)'
              })
            })
          })
          observer.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
