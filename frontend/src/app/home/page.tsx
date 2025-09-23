'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext'; // --- Import our custom auth hook ---
import { useApiClient } from '@/lib/useApiClient';

interface DashboardStats {
  participant_count: number;
  catechist_count: number;
  active_group_count: number;
}

const StatCard = ({ title, value, isLoading }: { title: string; value: number | string; isLoading: boolean }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    {isLoading ? (
      <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mt-2"></div>
    ) : (
      <p className="mt-1 text-4xl font-semibold text-gray-900 dark:text-white">{value}</p>
    )}
  </div>
);

const NavCard = ({ href, title, description }: { href: string; title: string; description: string }) => (
  <Link href={href} className="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-indigo-500 transition-all">
    <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{title} &rarr;</h3>
    <p className="mt-2 text-gray-600 dark:text-gray-400">{description}</p>
  </Link>
);

export default function HomePage() {
  // --- MODIFICATION: Use our custom auth hook ---
  const { user, isLoading: isAuthLoading } = useAuth();
  const api = useApiClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true); // Separate loading for data

  useEffect(() => {
    // Wait for auth to be checked and user to be present before fetching data
    if (!isAuthLoading && user && api) {
      async function fetchStats() {
        try {
          const data = await api.get<DashboardStats>('/api/dashboard/stats');
          setStats(data);
        } catch (error) {
          console.error(error);
          // Optionally set an error state here
        } finally {
          setLoading(false);
        }
      }
      fetchStats();
    }
  }, [isAuthLoading, user, api]); // Depend on auth state and api client

  // Show a loading screen while the AuthProvider is checking the session.
  if (isAuthLoading) {
    return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading session...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
        Welcome, {user?.username || 'User'}!
      </h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
        Here&apos;s a summary of your application data.
      </p>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Participants" value={stats?.participant_count ?? 0} isLoading={loading} />
        <StatCard title="Active Catechists" value={stats?.catechist_count ?? 0} isLoading={loading} />
        <StatCard title="Active Groups" value={stats?.active_group_count ?? 0} isLoading={loading} />
      </div>

      {/* Navigation Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Manage Your Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NavCard href="/participants" title="Participants" description="View, add, edit, and manage all participants." />
            <NavCard href="/catechists" title="Catechists" description="Manage catechists and view their group history." />
            <NavCard href="/groups" title="Groups" description="Create new groups and manage their members." />
        </div>
      </div>
    </div>
  );
}