"use client"
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../modal"
import { Button } from "../ui/button"
import { Key, Plus, Trash, X } from "lucide-react"
import { passkey } from "@/hooks/use-session"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useState, useEffect, useCallback } from "react"
import LoadingButton from "../loading-button"
import { NoItems } from "../app/no-items"
import { type Passkey } from "better-auth/plugins/passkey"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export default function PasskeySettingsModal({
  open,
  onOpenChange,
  getPasskeys,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  getPasskeys: () => Promise<Passkey[]>
}) {
  const t = useTranslations("settings")
  const tService = useTranslations("service")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [passkeyName, setPasskeyName] = useState("")

  const [existingPasskeys, setExistingPasskeys] = useState<Passkey[]>([]);

  const refetchPasskeys = useCallback(async () => {
    try {
      const passkeys = await getPasskeys()
      setExistingPasskeys(passkeys)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : t("unknown_error"))
    }
  }, [getPasskeys, t])

  useEffect(() => {
    if (open) {
      void refetchPasskeys()
    } else {
      setShowNameDialog(false)
      setPasskeyName("")
    }
  }, [open, refetchPasskeys])

  const deletePasskey = async (id: string) => {
    try {
      setIsSubmitting(true)
      const res = await passkey.deletePasskey({id});
      if (res.error) {
        const errorMessage = res.error?.message ?? t("unknown_error");
        throw new Error(errorMessage as string);
      }
      toast.success(t("passkey_deleted"))
      await refetchPasskeys()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : t("unknown_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const registerPasskey = async (name: string) => {
    try {
      setIsSubmitting(true)
      const result = await passkey.addPasskey({
        name: name || t("app_name"),
      });
      if (result?.error) {
        const errorMessage = result.error?.message ?? "";
        const errorCode = "code" in result.error ? result.error.code : "";
        
        // Handle user cancellation gracefully
        const isCancellation = 
          errorCode === "NotAllowedError" ||
          errorCode === "AbortError" ||
          (typeof errorMessage === "string" && (
            errorMessage.toLowerCase().includes("fallback") ||
            errorMessage.toLowerCase().includes("cancel") ||
            errorMessage.toLowerCase().includes("abort") ||
            errorMessage.toLowerCase().includes("not allowed")
          ));
        
        if (isCancellation) {
          // User cancelled - don't show error, just reset
          setShowNameDialog(false)
          setPasskeyName("")
          return
        }
        
        // For other errors, show a user-friendly message
        const friendlyMessage = (typeof errorMessage === "string" ? errorMessage : "") || t("passkey_error_unknown")
        throw new Error(friendlyMessage)
      }
      toast.success(t("passkey_added"))
      setShowNameDialog(false)
      setPasskeyName("")
      await refetchPasskeys()
    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : t("passkey_error_unknown")
      
      // Check if it's a cancellation error
      if (
        errorMessage.toLowerCase().includes("fallback") ||
        errorMessage.toLowerCase().includes("cancel") ||
        errorMessage.toLowerCase().includes("abort") ||
        errorMessage.toLowerCase().includes("not allowed")
      ) {
        // User cancelled - silently reset
        setShowNameDialog(false)
        setPasskeyName("")
        return
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddClick = () => {
    setShowNameDialog(true)
  }

  const handleCancelAdd = () => {
    setShowNameDialog(false)
    setPasskeyName("")
  }

  const handleConfirmAdd = () => {
    if (passkeyName.trim()) {
      void registerPasskey(passkeyName.trim())
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t("passkeys_title")}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex justify-between items-center mb-2 gap-2">
            <div className="font-semibold text-base">{t("your_passkeys")}</div>
            {!showNameDialog && (
              <LoadingButton variant="outline" loading={isSubmitting} onClick={handleAddClick} disabled={isSubmitting}>
                {!isSubmitting && <Plus className="w-4 h-4" />}
                {tService("add_new")}
              </LoadingButton>
            )}
          </div>
          {showNameDialog && (
            <div className="mb-4 p-4 border border-border rounded-md bg-accent/50">
              <div className="flex items-center gap-2 mb-3">
                <Label htmlFor="passkey-name" className="text-sm font-medium">{t("passkey_name")}</Label>
                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={handleCancelAdd} disabled={isSubmitting}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="passkey-name"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  placeholder={t("passkey_name_placeholder") || "My Passkey"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && passkeyName.trim()) {
                      handleConfirmAdd()
                    }
                  }}
                  autoFocus
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleCancelAdd} disabled={isSubmitting}>
                  {tService("cancel")}
                </Button>
                <LoadingButton onClick={handleConfirmAdd} loading={isSubmitting} disabled={!passkeyName.trim() || isSubmitting}>
                  {tService("add_new")}
                </LoadingButton>
              </div>
            </div>
          )}
          <div>
            {existingPasskeys && existingPasskeys.length > 0 ? (
              <>
                <ul className="divide-y divide-border mt-2 border border-border rounded-md overflow-hidden">
                  {existingPasskeys.map((pk, idx) => (
                    <li key={pk.id} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-accent transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-base">
                          {pk.name || t("passkey_fallback", { number: idx + 1 })}
                        </span>
                        {pk.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            {t("passkey_registered_at", {
                              date: new Date(pk.createdAt).toLocaleString(),
                            })}
                          </span>
                        )}
                      </div>
                      <LoadingButton variant="destructive" size="sm" loading={isSubmitting} onClick={() => deletePasskey(pk.id)} disabled={isSubmitting}>
                        {!isSubmitting && <Trash className="w-4 h-4" />}
                        {t("delete_passkey")}
                      </LoadingButton>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <NoItems
                  icon={Key}
                  title={t("no_registered_passkeys")}
                />
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tService("close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}