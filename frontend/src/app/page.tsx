'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Confirmand } from '@/types';
import AddConfirmandForm from './components/AddConfirmandForm';
import EditConfirmandModal from './components/EditConfirmandModal';

export default function Home() {
  const [confirmands, setConfirmands] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfirmand, setEditingConfirmand] = useState<Confirmand | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchConfirmands() {
      let response; // Declare response outside the try block
      try {
        console.log("Fetching participants...");
        response = await fetch('/api/confirmands');
        console.log("Response received with status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch data from the server: ${errorText}`);
        }

        const textData = await response.text(); // Get the raw text first
        console.log("Raw JSON response:", textData);
        
        if (!textData) {
            throw new Error("Received empty response from server.");
        }
        
        const data: Confirmand[] = JSON.parse(textData); // Manually parse it

        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received from server (not an array).");
        }

        setConfirmands(data);
        console.log("Participants state set successfully.");

      } catch (err: unknown) {
        // This will now catch JSON parsing errors too
        console.error("An error occurred in fetchConfirmands:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
        console.log("Finished fetch process, loading set to false.");
      }
    }
    fetchConfirmands();
  }, []);

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
    setConfirmands((prev) => [...prev, newConfirmand]);
  };

  const handleConfirmandUpdated = (updatedConfirmand: Confirmand) => {
    setConfirmands((prev) => 
      prev.map(c => c.id === updatedConfirmand.id ? updatedConfirmand : c)
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/confirmands/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete participant.');
      }
      setConfirmands((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) { // --- MODIFIED ---
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while deleting the participant.");
      }
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Confirmation Participants</h1>
      
      <AddConfirmandForm onConfirmandAdded={handleConfirmandAdded} />

      {/* --- MODIFICATION: Added dark mode classes to the search section --- */}
      <div className="my-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
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

      {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading participants...</p>}
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md my-4">Error: {error}</p>}

      {!loading && (
        // --- MODIFICATION: Added dark mode classes to the table and its container ---
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="py-3 px-6">Full Name</th>
                <th scope="col" className="py-3 px-6">Email</th>
                <th scope="col" className="py-3 px-6">Current Group</th>
                <th scope="col" className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfirmands.map((c) => (
                <tr key={c.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <Link href={`/participants/${c.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="py-4 px-6">{c.email}</td>
                  <td className="py-4 px-6">
                    {c.current_group_id ? (
                      <Link href={`/groups/${c.current_group_id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Module {c.current_group_module}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-6 flex gap-4">
                    <button onClick={() => setEditingConfirmand(c)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">
                      Delete
                    </button>
                  </td>
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

      {editingConfirmand && (
        <EditConfirmandModal 
          confirmand={editingConfirmand}
          onClose={() => setEditingConfirmand(null)}
          onConfirmandUpdated={handleConfirmandUpdated}
        />
      )}
    </main>
  );
}