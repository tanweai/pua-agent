import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface Props {
  isOpen: boolean
  children: ReactNode
}

export function Collapsible({ isOpen, children }: Props) {
  return (
    <div className={cn('collapsible-content', isOpen && 'expanded')}>
      <div>{children}</div>
    </div>
  )
}
