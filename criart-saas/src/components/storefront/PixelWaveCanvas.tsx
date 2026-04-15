'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  color: string
  life: number
  maxLife: number
  vx: number
  vy: number
}

export function PixelWaveCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Parse accent color
    const hexColor = accentColor.replace('#', '')
    const r = parseInt(hexColor.slice(0, 2), 16)
    const g = parseInt(hexColor.slice(2, 4), 16)
    const b = parseInt(hexColor.slice(4, 6), 16)

    const particles: Particle[] = []
    let animId: number
    let time = 0

    const draw = () => {
      if (!ctx) return
      animId = requestAnimationFrame(draw)
      time += 0.016

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Gera partículas em ondas por todo o canvas
      if (time % 0.5 < 0.016 * 2) {
        // Gera 2 ondas de partículas por segundo (mais lento)
        for (let i = 0; i < 8; i++) {
          const randomY = Math.random() * canvas.height
          const randomX = Math.random() * canvas.width
          const angle = Math.random() * Math.PI * 2
          const speed = 0.8 + Math.random() * 1.2
          const hue = Math.random() * 360

          particles.push({
            x: randomX,
            y: randomY,
            size: 4 + Math.random() * 6,
            color: `hsl(${hue}, 100%, 50%`,
            life: 0,
            maxLife: 120 + Math.random() * 100,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          })
        }
      }

      // Atualiza e desenha partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++
        p.vy += 0.08 // gravidade mais leve

        const alphaFadeIn = Math.min(1, p.life / 8)
        const alphaFadeOut = Math.min(1, (p.maxLife - p.life) / 20)
        const alpha = alphaFadeIn * alphaFadeOut

        // Pixel quadrado mais brilhante
        ctx.fillStyle = `${p.color}, ${Math.min(1, alpha * 1.2)})`
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)

        // Glow muito mais forte
        const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
        glowGrad.addColorStop(0, `${p.color}, ${Math.min(1, alpha * 0.9)})`)
        glowGrad.addColorStop(0.3, `${p.color}, ${Math.min(1, alpha * 0.5)})`)
        glowGrad.addColorStop(1, `${p.color}, 0)`)
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
        ctx.fill()

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
        }
      }
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [accentColor])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        cursor: 'crosshair',
      }}
    />
  )
}
