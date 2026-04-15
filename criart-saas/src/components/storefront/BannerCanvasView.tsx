import Image from 'next/image'
import type { CanvasData } from '@/app/(tenant)/admin/vitrine/BannerCanvasEditor'
import { LaserScanCanvas } from './LaserScanCanvas'
import { PixelWaveCanvas } from './PixelWaveCanvas'
import { AuroraCanvas } from './AuroraCanvas'
import { GradientMeshCanvas } from './GradientMeshCanvas'
import { FloatingOrbsCanvas } from './FloatingOrbsCanvas'
import { AntigravityCanvas } from './AntigravityCanvas'
import { MagneticCursorCanvas } from './MagneticCursorCanvas'

// Canvas lógico: 1600 x 500px — mesmo tamanho do editor
const CW = 1600
const CH = 500

interface Props {
  canvas: CanvasData
  tenantSlug?: string
  whatsapp?: string
  instagram?: string
  bannerStyle?: string
  accentColor?: string
  children?: React.ReactNode
}

export function BannerCanvasView({ canvas, tenantSlug, whatsapp, instagram, bannerStyle, accentColor = '#ea580c', children }: Props) {
  const resolveHref = (action?: string, href?: string) => {
    if (action === 'catalog' && tenantSlug) return `/vitrine/${tenantSlug}/catalogo`
    if (action === 'whatsapp' && whatsapp) return `https://wa.me/${whatsapp.replace(/\D/g, '')}`
    if (action === 'instagram' && instagram) return `https://instagram.com/${instagram.replace('@', '')}`
    if (action === 'custom' && href) return href
    return '#'
  }

  return (
    <section className="laser-sweep" style={{ position: 'relative', width: '100%', height: 'min(31.25vw, 480px)', overflow: 'hidden' }}>
      {/* Fundo com tema animado */}
      {bannerStyle === 'pixel' && <PixelWaveCanvas accentColor={accentColor} />}
      {bannerStyle === 'aurora' && <AuroraCanvas accentColor={accentColor} />}
      {bannerStyle === 'gradient' && <GradientMeshCanvas accentColor={accentColor} />}
      {bannerStyle === 'orbs' && <FloatingOrbsCanvas accentColor={accentColor} />}
      {bannerStyle === 'antigravity' && <AntigravityCanvas accentColor={accentColor} />}
      {bannerStyle === 'magnetic' && <MagneticCursorCanvas accentColor={accentColor} />}
      {!bannerStyle || bannerStyle === 'laser' ? <LaserScanCanvas accentColor={accentColor} /> : null}

      <div style={{ position: 'absolute', inset: 0, backgroundColor: canvas.bgColor }}>
        {/* fundo */}
        {canvas.bgImage && (
          <Image src={canvas.bgImage} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover', pointerEvents: 'none' }} />
        )}

        {/* elementos */}
        {canvas.elements.map(el => (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: `${(el.x / CW) * 100}%`,
              top: `${(el.y / CH) * 100}%`,
              width: `${(el.w / CW) * 100}%`,
              height: `${(el.h / CH) * 100}%`,
            }}
          >
            {el.type === 'text' && (
              <p style={{
                margin: 0, padding: 0,
                fontSize: `calc(${el.fontSize ?? 32} / ${CW} * 100cqw)`,
                color: el.color ?? '#ffffff',
                fontWeight: el.bold ? 'bold' : 'normal',
                fontStyle: el.italic ? 'italic' : 'normal',
                textAlign: el.align ?? 'left',
                fontFamily: 'var(--font-display, system-ui)',
                lineHeight: 1.2,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                containerType: 'inline-size',
              } as React.CSSProperties}>
                {el.text}
              </p>
            )}
            {el.type === 'image' && el.src && (
              <Image src={el.src} alt="" fill sizes="50vw" style={{ objectFit: 'contain' }} />
            )}
            {el.type === 'button' && (
              <a
                href={resolveHref(el.action, el.href)}
                target={el.action === 'custom' || el.action === 'whatsapp' || el.action === 'instagram' ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '100%',
                  backgroundColor: el.bgColor ?? '#ea580c',
                  borderRadius: `calc(${el.borderRadius ?? 12} / ${CW} * 100cqw)`,
                  color: el.textColor ?? '#ffffff',
                  fontSize: `calc(22 / ${CW} * 100cqw)`,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display, system-ui)',
                  textDecoration: 'none',
                  containerType: 'inline-size',
                } as React.CSSProperties}
              >
                {el.label}
              </a>
            )}
          </div>
        ))}

        {/* conteúdo extra (ex: botões passados como children) */}
        {children}
      </div>
    </section>
  )
}
