'use client'

import { useEffect, useRef } from 'react'

interface GradientBlob {
  x: number
  y: number
  targetX: number
  targetY: number
  radius: number
  color: string
}

export function GradientMeshCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
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

    // Create floating gradient blobs with holographic colors
    const hues = [0, 120, 240, 45, 180, 300]
    const blobs: GradientBlob[] = [
      { x: canvas.width * 0.25, y: canvas.height * 0.3, targetX: canvas.width * 0.25, targetY: canvas.height * 0.3, radius: 250, color: `hsla(${hues[0]}, 100%, 50%, 0.6)` },
      { x: canvas.width * 0.75, y: canvas.height * 0.7, targetX: canvas.width * 0.75, targetY: canvas.height * 0.7, radius: 220, color: `hsla(${hues[1]}, 100%, 50%, 0.55)` },
      { x: canvas.width * 0.5, y: canvas.height * 0.5, targetX: canvas.width * 0.5, targetY: canvas.height * 0.5, radius: 300, color: `hsla(${hues[2]}, 100%, 50%, 0.58)` },
    ]

    let animId: number
    let time = 0

    const draw = () => {
      if (!ctx) return
      animId = requestAnimationFrame(draw)
      time += 0.002

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update blob positions with smooth animation - move across entire canvas
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]
        const angle = time + i * (Math.PI * 2 / blobs.length)
        const distance = Math.sin(time * 0.2) * canvas.height * 0.3 + canvas.height * 0.2
        blob.targetX = canvas.width / 2 + Math.cos(angle) * distance
        blob.targetY = canvas.height / 2 + Math.sin(angle) * distance
        blob.x += (blob.targetX - blob.x) * 0.02
        blob.y += (blob.targetY - blob.y) * 0.02
      }

      // Draw blobs with gradient
      for (let blob of blobs) {
        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
        grad.addColorStop(0, blob.color)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw subtle grid overlay
      ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`
      ctx.lineWidth = 1.5
      const gridSize = 80
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
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
