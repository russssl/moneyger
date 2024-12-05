import ExpenseStatsCard from '@/components/charts/expense';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return (
    <>
      <div>
        <h1 className="text-4xl font-bold mb-8 ms-4 mt-4">Welcome back, {session.user.name}</h1>
        <ExpenseStatsCard />
      </div>
    </>
  );
}
