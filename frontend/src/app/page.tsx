'use client';

import { useState, useEffect } from 'react';
import { Confirmand } from '@/types';
import AddConfirmandForm from './components/AddConfirmandForm';
import EditConfirmandModal from './components/EditConfirmandModal';

export default function Home() {
  const [confirmands, setConfirmands] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage which participant is being edited. If null, the modal is hidden.
  const [editingConfirmand, setEditingConfirmand] = useState<Confirmand | null>(null);

  useEffect(() => {
    async function fetchConfirmands() {
      try {
        const response = await fetch('/api/confirmands');
        if (!response.ok) {
          throw new Error('Failed to fetch data from the server.');
        }
        const data: Confirmand[] = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from server.");
        }
        // Sort the initial data by name
        const sortedData = data.sort((a, b) => a.full_name.localeCompare(b.full_name));
        setConfirmands(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchConfirmands();
  }, []);

  // Callback for when a new participant is added via the form
  const handleConfirmandAdded = (newConfirmand: Confirmand) => {
    setConfirmands((prev) => 
      [...prev, newConfirmand].sort((a, b) => a.full_name.localeCompare(b.full_name))
    );
  };

  // Callback for when a participant is updated via the modal
  const handleConfirmandUpdated = (updatedConfirmand: Confirmand) => {
    setConfirmands((prev) => 
      prev.map(c => c.id === updatedConfirmand.id ? updatedConfirmand : c)
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
    );
  };

  // Handler for deleting a participant
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
      return;
    }
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
              {confirmands.map((c) => (
                <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{c.full_name}</td>
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
        </div>
      )}

      {/* Conditionally render the Edit Modal */}
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