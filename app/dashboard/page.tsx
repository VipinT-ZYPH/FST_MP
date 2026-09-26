import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSession } from '@/lib/security/proxy';
import { listEntries, getLatestSynthesis, listJournalSessions } from '@/lib/db';
import { DashboardClient } from '@/components/DashboardClient';
import DashboardLoading from './loading';

export const metadata: Metadata = {
  title: 'Reflective Workspace | ReflectAI',
  description: 'Your private AI journaling and reflection workspace.',
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login?redirect=/dashboard');
  }

  const [entries, synthesis, sessions] = await Promise.all([
    listEntries(session.user.id),
    getLatestSynthesis(session.user.id),
    listJournalSessions(session.user.id),
  ]);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient
        user={session.user}
        initialEntries={entries}
        initialSynthesis={synthesis}
        initialSessions={sessions}
      />
    </Suspense>
  );
}
