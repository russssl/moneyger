"use client"
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../modal"
import { Button } from "../ui/button"
import { Key, Plus } from "lucide-react"
import { passkey } from "@/hooks/use-session"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useState, useEffect, useCallback } from "react"
import LoadingButton from "../loading-button"
import { NoItems } from "../app/no-items"
import { type Passkey } from "better-auth/plugins/passkey"

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

  const [existingPasskeys, setExistingPasskeys] = useState<Passkey[]>([]);

  const refetchPasskeys = useCallback(async () => {
    try {
      const passkeys = await getPasskeys()
      setExistingPasskeys(passkeys)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")
    }
  }, [getPasskeys])

  useEffect(() => {
    if (open) {
      void refetchPasskeys()
    }
  }, [open, refetchPasskeys])

  const deletePasskey = async (id: string) => {
    const result = await passkey.deletePasskey({ id });
    if (result.error) {
      toast.error(result.error.message)
    }
    await refetchPasskeys()
    toast.success(t("passkey_deleted"))
  }

  const registerPasskey = async () => {
    try {
      setIsSubmitting(true)
      const result = await passkey.addPasskey({
        name: "Moneyger",
      });
      if (result?.error) {
        throw new Error(result.error.message ?? "An unknown error occurred")
      }
      await refetchPasskeys()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
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
            <LoadingButton variant="outline" loading={isSubmitting} onClick={registerPasskey} disabled={isSubmitting}>
              {!isSubmitting && <Plus className="w-4 h-4" />}
              {tService("add_new")}
            </LoadingButton>
          </div>
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
                      <Button variant="destructive" size="sm" onClick={() => deletePasskey(pk.id)}>
                        {t("delete_passkey")}
                      </Button>
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