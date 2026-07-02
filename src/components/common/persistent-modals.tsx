"use client";
import SetupModal from "./setup-modal";
import { useAuth } from "@/hooks/use-auth";

export default function PersistentModals() {
  const { data: session } = useAuth();
  
  return (
    session ? (
      <>
        <SetupModal />
      </>
    ) : null
  );
}