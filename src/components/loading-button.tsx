import { cn } from '@/lib/utils';
import { Button } from './ui/button'

const LoadingSpinner = ({ className }: { className?: string }) => {
  return (<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('animate-spin', className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>)
}

export default function LoadingButton({
  children,
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean }) {
  return (
    <Button
      className={cn(className, 'relative flex items-center justify-center')}
      disabled={loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner />
      )}
      {children}
    </Button>
  )
}
