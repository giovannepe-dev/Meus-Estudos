'use client'

import { useEffect, useRef, useState } from 'react'

interface Stat {
  value: number
  suffix: string
  label: string
}

interface Props {
  stats: Stat[]
}

function useCounter(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function StatItem({ stat, visible }: { stat: Stat; visible: boolean }) {
  const count = useCounter(stat.value, 1400, visible)
  return (
    <div className="vitrine-stat-item">
      <span className={`vitrine-stat-num${visible ? ' count-revealed' : ''}`}>
        {count}{stat.suffix}
      </span>
      <span className="vitrine-stat-label">{stat.label}</span>
    </div>
  )
}

export function AnimatedStats({ stats }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <ul className="vitrine-stats-bar">
        {stats.map((s, i) => (
          <StatItem key={i} stat={s} visible={visible} />
        ))}
      </ul>
    </div>
  )
}
