import { cn } from '@/lib/utils';
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react';

export default function LoadingButton({
  children,
  loading,
  className,
  variant = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean, variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'ghost' | 'link' | 'success' }) {
  return (
    <Button
      className={cn(className, 'relative flex items-center justify-center')}
      disabled={loading}
      variant={variant}
      {...props}
    >
      {loading && (
      <Loader2 className='animate-spin'/>
      )}
      {children}
    </Button>
  )
}
