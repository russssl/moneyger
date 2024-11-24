import { auth } from '@/server/auth';
import { getWallets } from '@/server/queries/wallets';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  const wallets = await getWallets();
  console.log(wallets);
  return (
    <></>
  );
}
