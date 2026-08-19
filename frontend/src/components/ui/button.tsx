import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-11 px-6',
          variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'outline' &&
            'border border-[var(--card-border)] bg-transparent hover:bg-white/5',
          variant === 'ghost' && 'hover:bg-white/5',
          variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
