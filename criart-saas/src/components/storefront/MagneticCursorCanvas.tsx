'use client'

import { useEffect, useRef } from 'react'

interface MagneticParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export function MagneticCursorCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
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

    const particles: MagneticParticle[] = []
    let animId: number
    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2
    let time = 0

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    window.addEventListener('mousemove', handleMouseMove)

    const draw = () => {
      if (!ctx) return
      animId = requestAnimationFrame(draw)
      time += 1

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Auto-spawn particles around random points
      if (time % 8 === 0) {
        const autoX = canvas.width * (0.5 + Math.sin(time * 0.01) * 0.4)
        const autoY = canvas.height * (0.5 + Math.cos(time * 0.008) * 0.4)

        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1.5 + Math.random() * 2.5
          const hue = Math.random() * 360

          particles.push({
            x: autoX,
            y: autoY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 6,
            color: `hsl(${hue}, 100%, 50%`,
            life: 0,
            maxLife: 80 + Math.random() * 100,
          })
        }
      }

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.5
            const hue = (Math.random() * 360)
            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        // Attraction to cursor
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 1) {
          const force = 0.08
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }

        // Damping
        p.vx *= 0.95
        p.vy *= 0.95

        p.x += p.vx
        p.y += p.vy
        p.life++

        // Fade in and fade out
        const alphaIn = Math.min(1, p.life / 10)
        const alphaOut = Math.min(1, (p.maxLife - p.life) / 15)
        const alpha = alphaIn * alphaOut

        // Draw particle
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        grad.addColorStop(0, `${p.color}, ${Math.min(1, alpha * 1.2)})`)
        grad.addColorStop(0.6, `${p.color}, ${alpha * 0.6})`)
        grad.addColorStop(1, `${p.color}, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw core - bright center
        const coreAlpha = Math.min(1, alpha * 1.5)
        ctx.fillStyle = `${p.color}, ${coreAlpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
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
      window.removeEventListener('mousemove', handleMouseMove)
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
