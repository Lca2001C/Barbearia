import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export function Card({
  children,
  hover = false,
  className = '',
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-slate-800 bg-slate-900 p-6
        ${hover ? 'transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/80' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
