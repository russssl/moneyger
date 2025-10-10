"use client"
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../modal"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"
import { passkey } from "@/hooks/use-session"
import { toast } from "sonner"
type UserPasskey = {
  id: string
  name: string
  createdAt?: string
}

export default function PasskeySettingsModal({
  open,
  onOpenChange,
  existingPasskeys,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingPasskeys: UserPasskey[]
}) {

  const registerPasskey = async () => {
    const result = await passkey.addPasskey({
      name: "Moneyger",
    });
    const error =
      result &&
      "error" in result &&
      result.error
        ? result.error
        : undefined;

    if (error) {
      console.error(error)
      toast.error(error.message)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Passkeys</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex justify-between items-center mb-2 gap-2">
            <div className="font-semibold text-base">Your passkeys</div>
            <Button variant="outline" size="sm" onClick={registerPasskey}>
              <Plus className="w-4 h-4 mr-2" />
              Add new
            </Button>
          </div>
          <div>
            {existingPasskeys.length > 0 ? (
              <>
                <ul className="divide-y divide-border mt-2 border border-border rounded-md overflow-hidden">
                  {existingPasskeys.map((pk, idx) => (
                    <li key={pk.id} className="flex flex-col px-4 py-3 bg-background hover:bg-accent transition-colors">
                      <span className="font-medium text-base">{pk.name || `Passkey #${idx + 1}`}</span>
                      {pk.createdAt && (
                        <span className="text-xs text-muted-foreground mt-1">
                          Registered: {new Date(pk.createdAt).toLocaleString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">No registered passkeys.</div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}