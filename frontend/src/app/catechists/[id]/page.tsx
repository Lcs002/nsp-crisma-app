'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CatechistDetails } from '@/types';

export default function CatechistDetailPage() {
  const params = useParams();
  const catechistId = params.id as string;

  const [details, setDetails] = useState<CatechistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!catechistId) return;

    async function fetchData() {
      try {
        const response = await fetch(`/api/catechists/${catechistId}/details`);
        if (!response.ok) {
          throw new Error('Failed to fetch catechist details.');
        }
        const data: CatechistDetails = await response.json();
        setDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [catechistId]);

  if (loading) return <p className="text-center p-8">Loading catechist details...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!details) return <p className="text-center p-8">Catechist not found.</p>;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/catechists" className="text-indigo-600 hover:underline">&larr; Back to All Catechists</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Catechist Info */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
          <h1 className="text-3xl font-bold text-gray-800">{details.full_name}</h1>
          <div className="mt-4 space-y-2 text-gray-600">
            <p>
              <strong>Status:</strong>
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${details.currently_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {details.currently_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>

        {/* Right Side: Group History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Group History</h2>
          {details.group_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3 px-6">Module</th>
                    <th scope="col" className="py-3 px-6">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {details.group_history.map(group => (
                    <tr key={group.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">Module {group.module}</td>
                      <td className="py-4 px-6">
                        <Link href={`/groups/${group.id}`} className="font-medium text-indigo-600 hover:underline">
                          View Group
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">This catechist has not been assigned to any groups.</p>
          )}
        </div>
      </div>
    </main>
  );
}