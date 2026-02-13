"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface BaseProps {
  children: React.ReactNode
}

interface RootModalProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
}

interface ModalSectionProps extends BaseProps {
  className?: string
  asChild?: true
}

const ModalContext = React.createContext<{ isDesktop: boolean }>({ isDesktop: true })

const Modal = ({ children, open, onOpenChange, ...props }: RootModalProps) => {
  const isDesktop = !useIsMobile()
  const ModalComponent = isDesktop ? Dialog : Drawer
  return (
    <ModalContext.Provider value={{ isDesktop }}>
      <ModalComponent open={open} onOpenChange={onOpenChange} {...props}>
        {children}
      </ModalComponent>
    </ModalContext.Provider>
  )
}

const ModalTrigger = ({ className, children, ...props }: ModalSectionProps) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalTriggerComponent = isDesktop ? DialogTrigger : DrawerTrigger

  return (
    <ModalTriggerComponent className={className} {...props}>
      {children}
    </ModalTriggerComponent>
  )
}

const ModalClose = ({ className, children, ...props }: ModalSectionProps & { disableClose?: boolean }) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalCloseComponent = isDesktop ? DialogClose : DrawerClose

  return (
    <ModalCloseComponent className={className} {...props}>
      {children}
    </ModalCloseComponent>
  )
}

const ModalContent = ({ className, children, onKeyDown, disableClose = false, ...props }: ModalSectionProps & { onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void, disableClose?: boolean }) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalContentComponent = isDesktop ? DialogContent : DrawerContent

  return (
    <div onKeyDown={onKeyDown} className="absolute inset-0 pointer-events-none">
      <ModalContentComponent className={className} disableClose={disableClose} {...props}>
        {children}
      </ModalContentComponent>
    </div>
  )
}

const ModalDescription = ({
  className,
  children,
  ...props
}: ModalSectionProps) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalDescriptionComponent = isDesktop ? DialogDescription : DrawerDescription

  return (
    <ModalDescriptionComponent className={className} {...props}>
      {children}
    </ModalDescriptionComponent>
  )
}

const ModalHeader = ({ className, children, ...props }: ModalSectionProps) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalHeaderComponent = isDesktop ? DialogHeader : DrawerHeader

  return (
    <ModalHeaderComponent className={className} {...props}>
      {children}
    </ModalHeaderComponent>
  )
}

const ModalTitle = ({ className, children, ...props }: ModalSectionProps) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalTitleComponent = isDesktop ? DialogTitle : DrawerTitle

  return (
    <ModalTitleComponent className={className} {...props}>
      {children}
    </ModalTitleComponent>
  )
}

const ModalBody = ({ className, children, ...props }: ModalSectionProps) => {
  return (
    <div className={cn("px-4 md:px-0 min-w-0 overflow-x-hidden", className)} {...props}>
      {children}
    </div>
  )
}

const ModalFooter = ({ className, children, ...props }: ModalSectionProps) => {
  const { isDesktop } = React.useContext(ModalContext)
  const ModalFooterComponent = isDesktop ? DialogFooter : DrawerFooter

  return (
    <ModalFooterComponent className={className} {...props}>
      {children}
    </ModalFooterComponent>
  )
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
}