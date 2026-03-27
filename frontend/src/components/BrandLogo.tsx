'use client'

import Link from 'next/link'

type BrandLogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
  /** Se true, não envolve em link (útil na landing). */
  standalone?: boolean
  href?: string
}

const sizes = { sm: 40, md: 48, lg: 56 }

export function BrandLogo({
  className = '',
  size = 'md',
  withText = true,
  standalone = false,
  href = '/',
}: BrandLogoProps) {
  const px = sizes[size]
  const inner = (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-700/80 bg-black px-2 py-1 shadow-md ring-1 ring-white/10"
        style={{ width: px, height: px }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-cia-do-disfarce.png"
          alt="Cia do Disfarce"
          width={px}
          height={px}
          className="h-full w-full object-contain"
        />
      </span>
      {withText && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="font-serif text-lg font-semibold tracking-tight text-white sm:text-xl">
            Cia do Disfarce
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 sm:text-xs">
            Barber Shop
          </span>
        </div>
      )}
    </div>
  )

  if (!standalone && href) {
    return (
      <Link href={href} className="min-w-0 shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
        {inner}
      </Link>
    )
  }

  return inner
}
