import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@/components/ui/stepper"
import { cn } from "@/lib/utils"

const steps = [
  {
    step: 1,
    title: "Email",
  },
  {
    step: 2,
    title: "Code",
  },
  {
    step: 3,
    title: "Password",
  },
  {
    step: 4,
    title: "Done",
  }
]

interface ResetPasswordStepperProps {
  className?: string
  currentStep: number
}

export default function Component({ className, currentStep }: ResetPasswordStepperProps) {
  return (
    <div className={cn("mx-auto max-w-xl space-y-8 text-center", className)}>
      <Stepper value={currentStep} className="items-start gap-4">
        {steps.map(({ step, title }) => (
          <StepperItem key={step} step={step} className="flex-1">
            <div className="w-full flex-col items-start gap-2 rounded">
              <StepperIndicator asChild className="bg-border h-1 w-full">
                <span className="sr-only">{step}</span>
              </StepperIndicator>
              <div className="space-y-0.5 flex justify-start">
                <StepperTitle>{title}</StepperTitle>
              </div>
            </div>
          </StepperItem>
        ))}
      </Stepper>
    </div>
  )
}
