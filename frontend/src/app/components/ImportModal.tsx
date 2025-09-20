'use client';

import { useState, ChangeEvent, useRef } from 'react';
import { useApiClient } from '@/lib/useApiClient';
import { Confirmand } from '@/types';

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: (newRecords: Confirmand[]) => void;
}

export default function ImportModal({ onClose, onImportSuccess }: ImportModalProps) {
  const api = useApiClient();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // To help with resetting the input

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleImport = async () => {
    if (!file || !api) return;

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);

    const fileContent = await file.text();
    
    try {
      // The apiClient doesn't support text/plain, so we use fetch directly
      // but get the token from Clerk's session object.
      // This is a safe workaround for this specific non-JSON case.
      const token = await (window as any).Clerk.session.getToken();
      
      const response = await fetch('/api/confirmands/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8', 
          'Authorization': `Bearer ${token}` 
        },
        body: fileContent,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred during import.');
      }

      setSuccessMessage(`Import successful! ${result.new_participants_imported} new participants added. ${result.rows_skipped} rows skipped.`);
      onImportSuccess(result.imported_records || []);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
      }
      // Close the modal after a short delay so the user can see the success message
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Import Participants</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a Tab-Separated Value (.tsv) file downloaded from Google Sheets. The columns must be in the correct order to be imported successfully.
          </p>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".tsv,.txt" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500 dark:text-gray-300
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 dark:file:bg-indigo-900/50
                       file:text-indigo-700 dark:file:text-indigo-300
                       hover:file:bg-indigo-100"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
            Close
          </button>
          <button 
            type="button" 
            onClick={handleImport} 
            disabled={!file || isImporting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {isImporting ? 'Importing...' : 'Upload and Import File'}
          </button>
        </div>
      </div>
    </div>
  );
}