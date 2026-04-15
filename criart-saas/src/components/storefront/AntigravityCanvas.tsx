'use client'

import { useEffect, useRef } from 'react'

interface FloatingElement {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  rotation: number
  rotationSpeed: number
}

export function AntigravityCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
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

    // Create floating elements with holographic colors
    const elements: FloatingElement[] = []
    const elementCount = 16
    const hueStep = 360 / elementCount
    for (let i = 0; i < elementCount; i++) {
      const hue = (i * hueStep) % 360
      elements.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: 30 + Math.random() * 60,
        color: `hsl(${hue}, 100%, 50%)`,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
      })
    }

    let animId: number
    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2

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

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw elements
      for (let elem of elements) {
        // Gravity-like force toward center
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const dx = centerX - elem.x
        const dy = centerY - elem.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 0) {
          elem.vx += (dx / dist) * 0.0008
          elem.vy += (dy / dist) * 0.0008
        }

        // Repulsion from cursor
        const cursorDx = elem.x - mouseX
        const cursorDy = elem.y - mouseY
        const cursorDist = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy)

        if (cursorDist < 150) {
          const force = (150 - cursorDist) / 150 * 0.015
          elem.vx += (cursorDx / cursorDist) * force
          elem.vy += (cursorDy / cursorDist) * force
        }

        // Damping
        elem.vx *= 0.98
        elem.vy *= 0.98

        elem.x += elem.vx
        elem.y += elem.vy

        // Bounce off walls
        if (elem.x - elem.radius < 0 || elem.x + elem.radius > canvas.width) {
          elem.vx *= -1
          elem.x = Math.max(elem.radius, Math.min(canvas.width - elem.radius, elem.x))
        }
        if (elem.y - elem.radius < 0 || elem.y + elem.radius > canvas.height) {
          elem.vy *= -1
          elem.y = Math.max(elem.radius, Math.min(canvas.height - elem.radius, elem.y))
        }

        // Rotation
        elem.rotation += elem.rotationSpeed

        // Draw rotating hexagon/geometric shape
        ctx.save()
        ctx.translate(elem.x, elem.y)
        ctx.rotate(elem.rotation)

        // Draw geometric shape
        ctx.fillStyle = elem.color.replace('50%)', '25%)')
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const x = Math.cos(angle) * elem.radius
          const y = Math.sin(angle) * elem.radius
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()

        // Border
        ctx.strokeStyle = elem.color.replace('50%)', '60%)')
        ctx.lineWidth = 2
        ctx.stroke()

        // Inner glow
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, elem.radius)
        glowGrad.addColorStop(0, elem.color.replace('50%)', '40%)'))
        glowGrad.addColorStop(1, elem.color.replace('50%)', '0%)'))
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(0, 0, elem.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
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
