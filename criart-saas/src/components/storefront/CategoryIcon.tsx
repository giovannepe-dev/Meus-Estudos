import Image from 'next/image'
import { getCategoryIcon } from '@/lib/utils/category-icon'

interface Props {
  nome: string
  emoji?: string | null
  imagem_url?: string | null
  size?: number
}

export function CategoryIcon({ nome, emoji, imagem_url, size = 48 }: Props) {
  const { emoji: autoEmoji, animClass } = getCategoryIcon(nome)
  const finalEmoji = emoji || autoEmoji

  if (imagem_url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.33,
        overflow: 'hidden', flexShrink: 0,
        border: '1px solid var(--lp-border)',
        background: 'var(--tenant-accent-pale)',
      }}>
        <Image src={imagem_url} alt={nome} width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }

  return (
    <div className="cat-icon-wrap" style={{
      width: size, height: size, borderRadius: size * 0.33,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--tenant-accent-pale, var(--lp-violet-pale))',
      border: '1px solid var(--lp-border)',
      flexShrink: 0,
    }}>
      <span
        className={animClass}
        style={{
          fontSize: size * 0.5,
          lineHeight: 1,
          display: 'block',
          userSelect: 'none',
        }}
      >
        {finalEmoji}
      </span>
    </div>
  )
}
