import { useAuth } from "@/client/hooks/use-auth";
import SetupModal from "@/client/components/common/setup-modal";

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