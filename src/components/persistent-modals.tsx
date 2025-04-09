import { headers } from "next/headers";
import SetupModal from "./setup-modal";
import { auth } from "@/lib/auth";

export default async function PersistentModals() {

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    session ? (
      <>
        <SetupModal />
      </>
    ) : null
  );
}