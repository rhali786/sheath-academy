'use client'

import React from 'react'
import { getAvatarSeed, getAvatarStyle, getInitials } from '@/features/messaging/front/lib/avatar'

interface AvatarProps {
  name?: string | null
  email?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

export function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
  const seed = getAvatarSeed(name, email)
  const initials = getInitials(name, email)
  const style = getAvatarStyle(seed)

  return (
    <div
      data-testid="message-avatar"
      aria-hidden="true"
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ${SIZE_CLASSES[size]} ${className}`}
      style={style}
    >
      {initials}
    </div>
  )
}
