"use client";
import SetupModal from "./setup-modal";
import { useAuthSession } from "@/hooks/use-session";

export default function PersistentModals() {
  const { data: session } = useAuthSession();
  
  return (
    session ? (
      <>
        <SetupModal />
      </>
    ) : null
  );
}