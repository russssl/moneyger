import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";

interface WalletFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (wallet: any) => void;
  isEditing?: boolean;
  id?: string;
  walletName?: string;
  currency?: string;
  initialBalance?: number;
  createWallet: { mutateAsync: (payload: any) => Promise<any> };
  updateWallet: { mutateAsync: (payload: any) => Promise<any> };
}

export default function AddNewWalletModal({
  open,
  onOpenChange,
  onSave,
  isEditing = false,
  id,
  walletName: initialName = "",
  currency: initialCurrency = "",
  initialBalance,
  createWallet,
  updateWallet,
}: WalletFormModalProps) {
  const [walletName, setWalletName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [balance, setBalance] = useState(initialBalance ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: walletName,
      currency,
      ...(isEditing ? {} : { initialBalance: balance || undefined }),
    };

    try {
      const result = isEditing
        ? await updateWallet.mutateAsync({ ...payload, id })
        : await createWallet.mutateAsync(payload);

      onSave(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving wallet:", error);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isEditing ? "Edit Wallet" : "Create Wallet"}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Label htmlFor="wallet-name">Wallet Name</Label>
          <Input
            placeholder="Wallet Name"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            required
          />
          <Label htmlFor="currency">Currency</Label>
          <Input
            placeholder="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
          {!isEditing && (
            <>
              <Label htmlFor="initial-balance">Initial Balance</Label>
              <Input
                placeholder="Initial Balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value))}
              />
            </>
          )}
          <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
        </form>
      </ModalContent>
    </Modal>
  );
}
