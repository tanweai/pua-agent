import { cn } from '../../utils/cn'

interface Props {
  size?: number
  className?: string
}

export function Spinner({ size = 16, className }: Props) {
  return (
    <svg className={cn('animate-spin-slow', className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60 30" />
    </svg>
  )
}
