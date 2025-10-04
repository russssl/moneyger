"use client"
import { Button } from "@/components/ui/button";
import { useMutation } from "@/hooks/use-api";
import { type Provider, signIn } from "@/hooks/use-session";
import { useState } from "react";
import { toast } from "sonner";

type ExtendedProvider = {
    id: string;
    name: string;
    icon?: React.ReactNode;
}

export default function ConnectedAccount({ accounts, provider }: { accounts: any[], provider: ExtendedProvider }) {
  const [localAccounts, setLocalAccounts] = useState(accounts);
  const removeAccountMutation = useMutation("/api/user/accounts/");

  const signInWithProvider = async (providerName: Provider) => {
    try {
      await signIn.social({
        provider: providerName,
        callbackURL: "/settings",
      }, {
        onSuccess: () => {
          setLocalAccounts(prev => [...prev, { providerId: provider.id, name: provider.name }]);
          toast.success(`Successfully connected with ${provider.name}`, {
            duration: 3000,
          });
        }
      });
    } catch (error) {
      console.error("Error signing in with provider:", error);
    }
  }

  const handleConnection = async (providerId: string) => {
    const accountExists = localAccounts.find(account => account.providerId === providerId);
    if (accountExists) {
      removeAccountMutation.mutate({ providerId });
      setLocalAccounts(prev => prev.filter(account => account.providerId !== providerId));
    } else {
      await signInWithProvider(provider.id as Provider);
    }
  };

  const account = localAccounts.find(account => account.providerId === provider.id);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          {provider?.icon}
        </div>
        <div>
          <p className="font-medium">{provider.name}</p>
          <p className="text-sm text-muted-foreground">
            {account ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => handleConnection(provider.id)}>
        {account ? "Disconnect" : "Connect"}
      </Button>
    </div>
  )
}