'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Confirmand } from '@/types';
import AddConfirmandForm from '../components/AddConfirmandForm';
import EditConfirmandModal from '../components/EditConfirmandModal';
import ImportModal from '../components/ImportModal'; // Import the new modal component
import { getGroupLabel } from '@/lib/utils';
import { useApiClient } from '@/lib/useApiClient';

export default function ParticipantsPage() {
  const { user, isLoaded } = useUser();
  const api = useApiClient();

  const [confirmands, setConfirmands] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfirmand, setEditingConfirmand] = useState<Confirmand | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // State for the new modal

  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin';

  const fetchConfirmands = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const data = await api.get<Confirmand[]>('/api/confirmands');
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from server.");
      }
      setConfirmands(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching participants.");
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isLoaded) {
      fetchConfirmands();
    }
  }, [isLoaded, fetchConfirmands]);

  const filteredConfirmands = useMemo(() => {
    if (!searchQuery) {
      return [...confirmands].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    return confirmands
      .filter(confirmand =>
        confirmand.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [confirmands, searchQuery]);

  const handleConfirmandAdded = (newConfirmand: Confirmand) => {
    setConfirmands((prev) => 
      [...prev, newConfirmand].sort((a, b) => a.full_name.localeCompare(b.full_name))
    );
  };

  const handleConfirmandUpdated = (updatedConfirmand: Confirmand) => {
    setConfirmands((prev) => 
      prev.map(c => c.id === updatedConfirmand.id ? updatedConfirmand : c)
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
    );
  };

  const handleDelete = async (id: number) => {
    if (!api || !window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/confirmands/${id}`);
      setConfirmands((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while deleting the participant.");
      }
    }
  };

  const handleImportSuccess = (newRecords: Confirmand[]) => {
    setConfirmands(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const trulyNewRecords = newRecords.filter(p => !existingIds.has(p.id));
        return [...prev, ...trulyNewRecords].sort((a, b) => a.full_name.localeCompare(b.full_name));
    });
  };

  if (!isLoaded) {
    return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading user session...</p>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Confirmation Participants</h1>
      
      {isAdmin && <AddConfirmandForm onConfirmandAdded={handleConfirmandAdded} />}

      <div className="my-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Search by Name
          </label>
          <input
            type="text"
            id="search"
            placeholder="Enter a name to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 block w-full sm:w-80 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Import from File
          </button>
        )}
      </div>

      {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading participants...</p>}
      {error && <p className="text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md my-4">Error: {error}</p>}

      {!loading && (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="py-3 px-6">Full Name</th>
                <th scope="col" className="py-3 px-6">Email</th>
                <th scope="col" className="py-3 px-6">Current Group</th>
                {isAdmin && <th scope="col" className="py-3 px-6">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredConfirmands.map((c) => (
                <tr key={c.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <Link href={`/participants/${c.id}`} className="hover:underline text-indigo-700 dark:text-indigo-400">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="py-4 px-6">{c.email}</td>
                  <td className="py-4 px-6">
                    {c.current_group_id && c.current_group_start_date ? (
                      <Link href={`/groups/${c.current_group_id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        {getGroupLabel(c.current_group_start_date)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6 flex gap-4">
                      <button onClick={() => setEditingConfirmand(c)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredConfirmands.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
              No participants found matching your search.
            </div>
          )}
        </div>
      )}

      {isAdmin && editingConfirmand && (
        <EditConfirmandModal 
          confirmand={editingConfirmand}
          onClose={() => setEditingConfirmand(null)}
          onConfirmandUpdated={handleConfirmandUpdated}
        />
      )}
      
      {isAdmin && isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </main>
  );
}