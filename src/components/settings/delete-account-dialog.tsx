"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger, ModalBody } from "@/components/common/modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { useMutation } from "@/hooks/use-api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import LoadingButton from "@/components/common/loading-button"

export default function DeleteAccountDialog() {
  const t = useTranslations("settings")
  const tService = useTranslations("service")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")

  const deleteAccountMutation = useMutation<Record<string, never>, { message: string }>("/api/user", "DELETE")

  const confirmationWord = t("delete_account_confirmation_word")
  const isConfirmed = confirmationText === confirmationWord

  useEffect(() => {
    if (!open) {
      setConfirmationText("")
    }
  }, [open])

  const handleDelete = async () => {
    if (!isConfirmed) {
      return
    }
    try {
      await deleteAccountMutation.mutateAsync({})
      toast.success(t("delete_account_success") || "Account deleted successfully")
      setOpen(false)
      setConfirmationText("")
      router.push("/login")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("unknown_error") || "Failed to delete account")
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="destructive">{t("delete_account")}</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t("delete_account_confirm_title")}</ModalTitle>
          <ModalDescription>
            {t("delete_account_confirm_description")}
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("delete_account_warning")}</AlertTitle>
              <AlertDescription>
                {t("delete_account_warning_description")}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("delete_account_confirmation_label")}
              </label>
              <Input
                placeholder={confirmationWord}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t("delete_account_confirmation_hint")}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteAccountMutation.isPending} className="w-full sm:w-auto">
            {tService("cancel")}
          </Button>
          <LoadingButton
            loading={deleteAccountMutation.isPending}
            onClick={handleDelete}
            disabled={!isConfirmed || deleteAccountMutation.isPending}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {t("delete_account")}
          </LoadingButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
