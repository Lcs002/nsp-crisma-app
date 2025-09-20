'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import { Confirmand } from '@/types';
import AddConfirmandForm from '../components/AddConfirmandForm';
import EditConfirmandModal from '../components/EditConfirmandModal';
import { useApiClient } from '@/lib/useApiClient';

// This new component handles the file upload UI and logic.
function CsvImport({ onImportSuccess }: { onImportSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setImportError(null);
            setImportSuccess(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            alert("Please select a file to import.");
            return;
        }
        setIsImporting(true);
        setImportError(null);
        setImportSuccess(null);

        const fileReader = new FileReader();
        fileReader.readAsText(file, 'UTF-8');
        fileReader.onload = async (e) => {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                setImportError("Failed to read file content.");
                setIsImporting(false);
                return;
            }
            
            try {
                const response = await fetch('/api/confirmands/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' }, // Send as plain text (CSV/TSV content)
                    body: content,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'An unknown error occurred during import.');
                }
                
                setImportSuccess(`Import successful! ${result.new_participants_imported} new participants added. ${result.rows_skipped} rows skipped.`);
                onImportSuccess(); // Tell the parent page to refetch data
                
                // Clear the file input visually by resetting the file state
                setFile(null);
                // And if you have an input ref, you could reset its value: e.g., fileInputRef.current.value = ""

            } catch (err: unknown) {
                if (err instanceof Error) {
                    setImportError(err.message);
                } else {
                    setImportError("An unknown error occurred.");
                }
            } finally {
                setIsImporting(false);
            }
        };
        fileReader.onerror = () => {
            setImportError("Error reading the selected file.");
            setIsImporting(false);
        };
    };

    return (
        <div className="my-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Import from CSV/TSV</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload a Tab-Separated file from Google Sheets to bulk-add participants. Ensure the columns match the expected format.
            </p>
            <div className="flex flex-wrap items-center gap-4">
                <input 
                  key={file ? file.name : 'empty'} // A trick to force re-render and show the cleared file
                  type="file" 
                  accept=".csv,.tsv,.txt" 
                  onChange={handleFileChange} 
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                />
                <button 
                  onClick={handleImport} 
                  disabled={!file || isImporting} 
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                >
                    {isImporting ? 'Importing...' : 'Import'}
                </button>
            </div>
            {importError && <p className="mt-2 text-sm text-red-500">{importError}</p>}
            {importSuccess && <p className="mt-2 text-sm text-green-600">{importSuccess}</p>}
        </div>
    );
}


export default function Home() {
  const [confirmands, setConfirmands] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfirmand, setEditingConfirmand] = useState<Confirmand | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConfirmands = async () => {
    try {
        setLoading(true);
        const response = await fetch('/api/confirmands');
        if (!response.ok) throw new Error('Failed to fetch data from the server.');
        const data: Confirmand[] = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format received from server.");
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
  };

  useEffect(() => {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while deleting the participant.");
      }
    }
  };

  const handleImportSuccess = () => {
    // This is the callback that refreshes the data after a successful import
    fetchConfirmands();
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Confirmation Participants</h1>
      
      <AddConfirmandForm onConfirmandAdded={handleConfirmandAdded} />

      <CsvImport onImportSuccess={handleImportSuccess} />

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
      {error && <p className="text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md my-4">Error: {error}</p>}

      {!loading && (
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
                        {getGroupLabel(c.start_date || '')}
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

// Add getGroupLabel helper function if not in a separate utils file
// For simplicity here, but better in lib/utils.ts
const getGroupLabel = (startDate: string): string => {
  if (!startDate) return 'Group';
  const date = new Date(startDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); 
  const semester = month < 6 ? "1st" : "2nd";
  return `${year} ${semester} Semester`;
};