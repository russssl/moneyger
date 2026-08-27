export type WalletFormState = {
  walletName: string;
  balance: number | null;
  currency: string | undefined;
};

export type WalletFormAction =
  | { type: "SET_WALLET_NAME"; payload: string }
  | { type: "SET_BALANCE"; payload: number | null }
  | { type: "SET_CURRENCY"; payload: string | undefined }
  | { type: "RESET"; payload?: string | undefined };
