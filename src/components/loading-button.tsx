import { cn } from "@/lib/utils";
import { Button } from "./ui/button"
import { toast } from "sonner"; // Add this import
import { Spinner } from "@/components/ui/spinner"

export default function LoadingButton({
  children,
  loading,
  className,
  variant = "default",
  toastText,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading: boolean,
  variant?: "default" | "destructive" | "outline" | "secondary" | "success" | "ghost" | "link",
  toastText?: string
}) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    if (toastText) {
      toast.success(toastText);
    }
  };

  return (
    <Button
      className={cn(className, "relative flex items-center justify-center")}
      disabled={loading}
      variant={variant}
      {...props}
      onClick={handleClick}
    >
      {loading && (
        <Spinner />
      )}
      {children}
    </Button>
  )
}
