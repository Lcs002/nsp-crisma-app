'use client';

import { useState, useEffect, useMemo } from 'react'; // --- NEW: Import useMemo ---
import Link from 'next/link';
import { Confirmand } from '@/types';
import AddConfirmandForm from './components/AddConfirmandForm';
import EditConfirmandModal from './components/EditConfirmandModal';

export default function Home() {
  const [confirmands, setConfirmands] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfirmand, setEditingConfirmand] = useState<Confirmand | null>(null);

  // --- NEW --- State for the search query --- NEW ---
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchConfirmands() {
      try {
        const response = await fetch('/api/confirmands');
        if (!response.ok) throw new Error('Failed to fetch data from the server.');
        const data: Confirmand[] = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format received from server.");
        // We set the main list here. Sorting will happen in the filtered list.
        setConfirmands(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchConfirmands();
  }, []);

  // --- NEW --- Create a filtered and sorted list based on the search query --- NEW ---
  // useMemo ensures this expensive filtering logic only runs when the source list or query changes.
  const filteredConfirmands = useMemo(() => {
    if (!searchQuery) {
      // If no search query, return the full list, sorted
      return [...confirmands].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    // Otherwise, filter and then sort
    return confirmands
      .filter(confirmand =>
        confirmand.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [confirmands, searchQuery]); // Dependency array for useMemo


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
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Confirmation Participants</h1>
      
      <AddConfirmandForm onConfirmandAdded={handleConfirmandAdded} />

      {/* --- NEW --- Search Bar Section --- NEW --- */}
      <div className="my-6 bg-white p-4 rounded-lg shadow-md">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search by Name
        </label>
        <input
          type="text"
          id="search"
          placeholder="Enter a name to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {/* --- END NEW --- */}

      {loading && <p className="text-center text-gray-500">Loading participants...</p>}
      {error && <p className="text-red-600 bg-red-100 p-4 rounded-md my-4">Error: {error}</p>}

      {!loading && (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="py-3 px-6">Full Name</th>
                <th scope="col" className="py-3 px-6">Email</th>
                <th scope="col" className="py-3 px-6">Phone Number</th>
                <th scope="col" className="py-3 px-6">Marital Status</th>
                <th scope="col" className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* --- MODIFICATION: We now map over the `filteredConfirmands` list --- */}
              {filteredConfirmands.map((c) => (
                <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    <Link href={`/participants/${c.id}`} className="hover:underline text-indigo-700">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="py-4 px-6">{c.email}</td>
                  <td className="py-4 px-6">{c.phone_number}</td>
                  <td className="py-4 px-6">{c.marital_status}</td>
                  <td className="py-4 px-6 flex gap-4">
                    <button onClick={() => setEditingConfirmand(c)} className="font-medium text-indigo-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* --- NEW: Show a message if the search yields no results --- */}
          {filteredConfirmands.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
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