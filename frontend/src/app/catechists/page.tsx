'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Catechist } from '@/types';
import { useApiClient } from '@/lib/useApiClient';

export const dynamic = 'force-dynamic';

export default function CatechistsPage() {
  const api = useApiClient(); 
  const [catechists, setCatechists] = useState<Catechist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCatechists() {
      if (!api) return;
      try {
        const data = await api.get<Catechist[]>('/api/catechists');
        setCatechists(data);
      } catch (err: unknown) { // --- MODIFIED ---
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching catechists.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCatechists();
  }, [api]);

  const filteredCatechists = useMemo(() => {
    if (!searchQuery) {
      return [...catechists].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    return catechists
      .filter(catechist =>
        catechist.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [catechists, searchQuery]);

  const handleAddCatechist = async (e: FormEvent) => {
    e.preventDefault();
    if (!api) return;
    setIsSubmitting(true);
    setError(null);

    const newCatechistPayload = {
      full_name: fullName,
      currently_active: isActive,
    };

    try {
      const createdCatechist = await api.post<Catechist>('/api/catechists', newCatechistPayload);
      setCatechists(prev => [...prev, createdCatechist]);
      setFullName('');
      setIsActive(true);

    } catch (err: unknown) { // --- MODIFIED ---
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while adding the catechist.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Manage Catechists</h1>
          
          {/* --- MODIFICATION: Added dark mode classes to the search section --- */}
          <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search by Name
            </label>
            <input
              type="text"
              id="search"
              placeholder="Enter a name to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading catechists...</p>}
          {error && !loading && <p className="text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md">Error: {error}</p>}
          
          {!loading && (
            // --- MODIFICATION: Added dark mode classes to the table and its container ---
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="py-3 px-6">Full Name</th>
                    <th scope="col" className="py-3 px-6">Status</th>
                    <th scope="col" className="py-3 px-6">Latest Group</th>
                    <th scope="col" className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatechists.map((c) => (
                    <tr key={c.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-4 px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <Link href={`/catechists/${c.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                          {c.full_name}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.currently_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {c.currently_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {c.latest_group_id ? (
                          <Link href={`/groups/${c.latest_group_id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                            Module {c.latest_group_module}
                          </Link>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6 flex gap-4">
                        <button className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-gray-400" disabled>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCatechists.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                  No catechists found matching your search.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {/* --- MODIFICATION: Added dark mode classes to the "Add" form --- */}
          <form onSubmit={handleAddCatechist} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md sticky top-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Add New Catechist</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              
              <div className="flex items-center pt-2">
                <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} 
                  className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500" />
                <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-300">Currently Active</label>
              </div>
            </div>
            
            {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
            
            <div className="mt-6">
              <button type="submit" disabled={isSubmitting} 
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                {isSubmitting ? 'Adding...' : 'Add Catechist'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}