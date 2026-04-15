'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  type: 'dot' | 'beam'
  beamLen: number
  angle: number
  color: string
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const gfx = ctx // non-null alias for use inside closures

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#ea580c', '#f97316', '#fb923c', '#ffffff', '#fbbf24']
    const particles: Particle[] = []
    const c = canvas // non-null alias for use inside closures

    function spawn(): Particle {
      const type = Math.random() < 0.3 ? 'beam' : 'dot'
      const angle = (Math.random() * 60 - 30) * (Math.PI / 180) // mostly horizontal-ish
      const speed = type === 'beam' ? 2.5 + Math.random() * 3 : 0.6 + Math.random() * 1.2
      const side = Math.random() < 0.5 ? 0 : c.width
      const x = side === 0 ? -10 : c.width + 10
      const dir = side === 0 ? 1 : -1
      return {
        x,
        y: Math.random() * c.height,
        vx: Math.cos(angle) * speed * dir,
        vy: Math.sin(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
        life: 0,
        maxLife: 80 + Math.random() * 120,
        size: type === 'dot' ? 1 + Math.random() * 2.5 : 1,
        type,
        beamLen: 30 + Math.random() * 80,
        angle: Math.atan2(Math.sin(angle) * dir, Math.cos(angle) * dir),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    // Seed initial particles
    for (let i = 0; i < 18; i++) {
      const p = spawn()
      p.life = Math.random() * p.maxLife
      particles.push(p)
    }

    let animId: number
    let frame = 0

    function draw() {
      animId = requestAnimationFrame(draw)
      frame++

      gfx.clearRect(0, 0, c.width, c.height)

      // Spawn new particles
      if (frame % 8 === 0 && particles.length < 30) {
        particles.push(spawn())
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++

        const alpha = Math.min(1, p.life / 20) * Math.min(1, (p.maxLife - p.life) / 20) * 0.7

        if (p.type === 'beam') {
          // Laser beam line
          const gradient = gfx.createLinearGradient(
            p.x, p.y,
            p.x - Math.cos(p.angle) * p.beamLen,
            p.y - Math.sin(p.angle) * p.beamLen
          )
          gradient.addColorStop(0, p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(/rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (_, r, g, b) => `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)}`))

          gfx.beginPath()
          gfx.moveTo(p.x, p.y)
          gfx.lineTo(p.x - Math.cos(p.angle) * p.beamLen, p.y - Math.sin(p.angle) * p.beamLen)

          // Parse color for rgba
          const hex = p.color.replace('#', '')
          const r = parseInt(hex.slice(0, 2), 16)
          const g = parseInt(hex.slice(2, 4), 16)
          const b = parseInt(hex.slice(4, 6), 16)

          const grad2 = gfx.createLinearGradient(
            p.x, p.y,
            p.x - Math.cos(p.angle) * p.beamLen,
            p.y - Math.sin(p.angle) * p.beamLen
          )
          grad2.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
          grad2.addColorStop(1, `rgba(${r},${g},${b},0)`)

          gfx.strokeStyle = grad2
          gfx.lineWidth = 1.5
          gfx.stroke()

          // Glow dot at head
          gfx.beginPath()
          gfx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
          gfx.fillStyle = `rgba(${r},${g},${b},${alpha * 1.5})`
          gfx.fill()

        } else {
          // Floating dot
          const hex = p.color.replace('#', '')
          const r = parseInt(hex.slice(0, 2), 16)
          const g = parseInt(hex.slice(2, 4), 16)
          const b = parseInt(hex.slice(4, 6), 16)

          gfx.beginPath()
          gfx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          gfx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.8})`
          gfx.fill()

          // Glow
          gfx.beginPath()
          gfx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          const glow = gfx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
          glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.3})`)
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
          gfx.fillStyle = glow
          gfx.fill()
        }

        if (p.life >= p.maxLife || p.x < -100 || p.x > c.width + 100 || p.y < -100 || p.y > c.height + 100) {
          particles.splice(i, 1)
        }
      }
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
