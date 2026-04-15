'use client'

import { useEffect, useRef } from 'react'

interface LaserScanLine {
  y: number
  scanProgress: number // 0-1
  intensity: number // 0-1
}

export function LaserScanCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
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

    // Parse accent color (remove # if present)
    const hexColor = accentColor.replace('#', '')
    const r = parseInt(hexColor.slice(0, 2), 16)
    const g = parseInt(hexColor.slice(2, 4), 16)
    const b = parseInt(hexColor.slice(4, 6), 16)

    let animId: number
    let time = 0

    const draw = () => {
      if (!ctx) return
      animId = requestAnimationFrame(draw)
      time += 0.01

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Simulate laser engraving: multiple scan lines sweeping horizontally
      const scanLineCount = 60
      const scanLineHeight = canvas.height / scanLineCount

      for (let i = 0; i < scanLineCount; i++) {
        const y = i * scanLineHeight + scanLineHeight / 2

        // Stagger each line's start time - faster scanning
        const lineTime = (time * 1.2 - (i * 0.025)) % 2.5
        let scanProgress = lineTime / 1.8 // takes 1.8 seconds to scan

        // Intensity: bright at start of scan, fades out
        let intensity = 1.0
        if (scanProgress > 0.75) {
          intensity = Math.max(0, (1.0 - scanProgress) / 0.25)
        }
        if (scanProgress > 1.0) {
          scanProgress = 1.0
          intensity = 0
        }

        // Draw horizontal laser line (sweep from left to right)
        const scanX = scanProgress * canvas.width
        const hue = (i * 6 + time * 100) % 360

        // Main laser beam — bright line (much stronger)
        const grad = ctx.createLinearGradient(
          Math.max(0, scanX - 15), y,
          Math.max(0, scanX - 120), y
        )
        grad.addColorStop(0, `hsla(${hue}, 100%, 50%, ${Math.min(1, intensity * 1.2)})`)
        grad.addColorStop(0.3, `hsla(${hue}, 100%, 45%, ${intensity * 0.8})`)
        grad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`)

        ctx.strokeStyle = grad
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(Math.max(0, scanX - 120), y)
        ctx.lineTo(scanX, y)
        ctx.stroke()

        // Strong glow effect
        const glowGrad = ctx.createLinearGradient(
          Math.max(0, scanX - 25), y,
          Math.max(0, scanX - 150), y
        )
        glowGrad.addColorStop(0, `hsla(${hue}, 100%, 50%, ${intensity * 0.7})`)
        glowGrad.addColorStop(0.4, `hsla(${hue}, 100%, 45%, ${intensity * 0.3})`)
        glowGrad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`)

        ctx.strokeStyle = glowGrad
        ctx.lineWidth = 14
        ctx.beginPath()
        ctx.moveTo(Math.max(0, scanX - 150), y)
        ctx.lineTo(scanX, y)
        ctx.stroke()

        // Extra bright core
        const coreGrad = ctx.createLinearGradient(
          Math.max(0, scanX - 10), y,
          Math.max(0, scanX - 60), y
        )
        coreGrad.addColorStop(0, `hsla(${hue}, 100%, 55%, ${intensity * 1.5})`)
        coreGrad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`)
        ctx.strokeStyle = coreGrad
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(Math.max(0, scanX - 60), y)
        ctx.lineTo(scanX, y)
        ctx.stroke()

        // Bright dot at laser head (bigger)
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${Math.min(1, intensity * 1.3)})`
        ctx.beginPath()
        ctx.arc(scanX, y, 5, 0, Math.PI * 2)
        ctx.fill()

        // Spark particles around the head (more intense)
        if (intensity > 0.1) {
          for (let s = 0; s < 6; s++) {
            const sparkAngle = Math.random() * Math.PI * 2
            const sparkDist = 6 + Math.random() * 16
            const sparkX = scanX + Math.cos(sparkAngle) * sparkDist
            const sparkY = y + Math.sin(sparkAngle) * sparkDist

            ctx.fillStyle = `hsla(${hue}, 100%, 55%, ${intensity * 0.8})`
            ctx.beginPath()
            ctx.arc(sparkX, sparkY, 1.2 + Math.random() * 2, 0, Math.PI * 2)
            ctx.fill()
          }
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
      }}
    />
  )
}
