import { api } from "@/trpc/server";

export default function TotalBalance() {
  const data = api.wallets.getFullData();
}