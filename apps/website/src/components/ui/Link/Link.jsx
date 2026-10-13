import { Link as RouterLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function Link({ to, href, className, children, external, ...props }) {
  const classes = cn(
    'transition-colors duration-200 ease-out-expo',
    className,
  )

  if (external || href) {
    return (
      <a
        href={href || to}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={classes} {...props}>
      {children}
    </RouterLink>
  )
}
