'use client'

import { useEffect, useRef } from 'react'

export function AuroraCanvas({ accentColor = '#ea580c' }: { accentColor?: string }) {
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

    // Parse color
    const hexColor = accentColor.replace('#', '')
    const r = parseInt(hexColor.slice(0, 2), 16)
    const g = parseInt(hexColor.slice(2, 4), 16)
    const b = parseInt(hexColor.slice(4, 6), 16)

    let animId: number
    let time = 0

    // Rainbow colors for holographic effect
    const rainbowColors = [
      { r: 255, g: 0, b: 255 },    // Magenta
      { r: 255, g: 0, b: 127 },    // Pink
      { r: 255, g: 0, b: 0 },      // Red
      { r: 255, g: 127, b: 0 },    // Orange
      { r: 255, g: 255, b: 0 },    // Yellow
      { r: 0, g: 255, b: 0 },      // Green
      { r: 0, g: 255, b: 255 },    // Cyan
      { r: 0, g: 127, b: 255 },    // Sky
      { r: 0, g: 0, b: 255 },      // Blue
    ]

    const draw = () => {
      if (!ctx) return
      animId = requestAnimationFrame(draw)
      time += 0.008

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Desenha ondas aurora em movimento - mais fortes e visíveis
      for (let wave = 0; wave < 6; wave++) {
        const waveTime = time + wave * 0.3
        const amplitude = 60 + wave * 20
        const frequency = 0.006 - wave * 0.0006
        const color = rainbowColors[wave % rainbowColors.length]

        ctx.beginPath()
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = canvas.height / 2 + Math.sin((x + waveTime * 250) * frequency) * amplitude
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        const alpha = Math.max(0.08, 0.3 - wave * 0.025)
        gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`)
        gradient.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},${alpha * 0.7})`)
        gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = 4 + wave * 0.5
        ctx.stroke()

        // Fill below - mais visível
        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.7})`
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
