'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'border border-amber-200/30 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-zinc-950 font-semibold shadow-lg shadow-amber-500/30 hover:from-amber-200 hover:via-amber-300 hover:to-amber-400',
  secondary:
    'border border-amber-100/20 bg-gradient-to-r from-zinc-800 to-zinc-700 text-amber-100 shadow-md shadow-black/30 hover:from-zinc-700 hover:to-zinc-600',
  danger: 'border border-red-300/20 bg-red-600 text-white hover:bg-red-500',
  ghost:
    'border border-zinc-200/15 bg-zinc-100/5 text-zinc-200 hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-100',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]
          focus:outline-none focus:ring-2
          focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-slate-950
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
