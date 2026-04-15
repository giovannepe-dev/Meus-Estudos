'use client'

import { useEffect, useRef } from 'react'

interface Orb {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  alphaVel: number
  color: string
}

export function FloatingOrbsCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
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

    // Create floating orbs with holographic colors
    const orbs: Orb[] = []
    const orbCount = 15
    const hueSteps = 360 / orbCount
    for (let i = 0; i < orbCount; i++) {
      const hue = (i * hueSteps) % 360
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 60 + Math.random() * 100,
        alpha: 0.35 + Math.random() * 0.35,
        alphaVel: (Math.random() - 0.5) * 0.012,
        color: `hsl(${hue}, 100%, 50%)`,
      })
    }

    let animId: number

    const draw = () => {
      if (!ctx) return
      animId = requestAnimationFrame(draw)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw orbs
      for (let orb of orbs) {
        orb.x += orb.vx
        orb.y += orb.vy

        // Bounce off walls
        if (orb.x - orb.radius < 0 || orb.x + orb.radius > canvas.width) {
          orb.vx *= -1
          orb.x = Math.max(orb.radius, Math.min(canvas.width - orb.radius, orb.x))
        }
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > canvas.height) {
          orb.vy *= -1
          orb.y = Math.max(orb.radius, Math.min(canvas.height - orb.radius, orb.y))
        }

        // Oscillate alpha
        orb.alpha += orb.alphaVel
        if (orb.alpha < 0.3 || orb.alpha > 0.65) {
          orb.alphaVel *= -1
          orb.alpha = Math.max(0.3, Math.min(0.65, orb.alpha))
        }

        // Draw orb with glow
        // Inner bright sphere
        const grad = ctx.createRadialGradient(orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, 0, orb.x, orb.y, orb.radius)
        grad.addColorStop(0, orb.color.replace('50%)', `${Math.min(100, orb.alpha * 250)}%)`))
        grad.addColorStop(0.4, orb.color.replace('50%)', `${orb.alpha * 200}%)`))
        grad.addColorStop(1, orb.color.replace('50%)', `${orb.alpha * 50}%)`))

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()

        // Medium glow
        const medGlow = ctx.createRadialGradient(orb.x, orb.y, orb.radius * 0.7, orb.x, orb.y, orb.radius * 2)
        medGlow.addColorStop(0, orb.color.replace('50%)', `${orb.alpha * 120}%)`))
        medGlow.addColorStop(0.5, orb.color.replace('50%)', `${orb.alpha * 60}%)`))
        medGlow.addColorStop(1, orb.color.replace('50%)', '0%)'))
        ctx.fillStyle = medGlow
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius * 2, 0, Math.PI * 2)
        ctx.fill()

        // Outer glow - much brighter
        const glowGrad = ctx.createRadialGradient(orb.x, orb.y, orb.radius * 0.3, orb.x, orb.y, orb.radius * 4)
        glowGrad.addColorStop(0, orb.color.replace('50%)', `${orb.alpha * 100}%)`))
        glowGrad.addColorStop(0.3, orb.color.replace('50%)', `${orb.alpha * 60}%)`))
        glowGrad.addColorStop(1, orb.color.replace('50%)', '0%)'))
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius * 4, 0, Math.PI * 2)
        ctx.fill()
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
      }}
    />
  )
}
