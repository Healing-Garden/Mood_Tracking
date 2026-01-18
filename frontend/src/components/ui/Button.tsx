import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  variant = 'default', 
  size = 'md', 
  className, 
  children,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    default: 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)_/_0.9)]',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    outline: 'border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary)_/_0.05)]',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
