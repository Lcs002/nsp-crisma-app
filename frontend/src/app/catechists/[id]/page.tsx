'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CatechistDetails } from '@/types';
import { useApiClient } from '@/lib/useApiClient';

export default function CatechistDetailPage() {
  const params = useParams();
  const catechistId = params.id as string;
  const api = useApiClient();
  const [details, setDetails] = useState<CatechistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!catechistId || !api) return;

    async function fetchData() {
      try {
        const data = await api.get<CatechistDetails>(`/api/catechists/${catechistId}/details`);
        setDetails(data);
      // --- THIS IS THE FIX ---
      } catch (err: unknown) { // Use `unknown` instead of `any`
        if (err instanceof Error) {
          setError(err.message); // Safely access .message after checking
        } else {
          setError("An unknown error occurred.");
        }
      } 
      // --- END FIX ---
      finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [catechistId, api]);

  if (loading) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading catechist details...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!details) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Catechist not found.</p>;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/catechists" className="text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to All Catechists</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- MODIFICATION: Added dark mode classes to the info card --- */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{details.full_name}</h1>
          <div className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
            <p>
              <strong>Status:</strong>
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${details.currently_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                {details.currently_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>

        {/* --- MODIFICATION: Added dark mode classes to the group history card --- */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Group History</h2>
          {details.group_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="py-3 px-6">Module</th>
                    <th scope="col" className="py-3 px-6">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {details.group_history.map(group => (
                    <tr key={group.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Module {group.module}</td>
                      <td className="py-4 px-6">
                        <Link href={`/groups/${group.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                          View Group
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">This catechist has not been assigned to any groups.</p>
          )}
        </div>
      </div>
    </main>
  );
}