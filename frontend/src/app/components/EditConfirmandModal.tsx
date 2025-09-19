// frontend/src/app/components/EditConfirmandModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Confirmand } from '@/types';

interface EditConfirmandModalProps {
  confirmand: Confirmand;
  onClose: () => void;
  onConfirmandUpdated: (updatedConfirmand: Confirmand) => void;
}

export default function EditConfirmandModal({ confirmand, onClose, onConfirmandUpdated }: EditConfirmandModalProps) {
  // Initialize form state with the data of the participant being edited
  const [fullName, setFullName] = useState(confirmand.full_name);
  const [email, setEmail] = useState(confirmand.email);
  const [phone, setPhone] = useState(confirmand.phone_number);
  // The date from the DB is a full ISO string, but the input needs YYYY-MM-DD
  const [birthDate, setBirthDate] = useState(new Date(confirmand.creation_date).toISOString().split('T')[0]);
  const [address, setAddress] = useState(''); // Assuming address is not fetched in the list view yet
  const [maritalStatus, setMaritalStatus] = useState(confirmand.marital_status);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Note: A more advanced version would fetch the full confirmand details here
  // if the list view doesn't contain all fields (like address). For now, we'll assume it does.

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const updatedPayload = {
      full_name: fullName,
      email: email,
      phone_number: phone,
      birth_date: birthDate,
      address: address || 'N/A', // Handle empty address
      marital_status: maritalStatus,
    };

    try {
      const response = await fetch(`/api/confirmands/${confirmand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update participant.');
      }

      const updatedData: Confirmand = await response.json();
      onConfirmandUpdated(updatedData); // Notify parent component of the change
      onClose(); // Close the modal

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    // Modal backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      {/* Modal content */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Edit Participant</h2>
        {/* We can reuse the same form structure as AddConfirmandForm */}
        <form onSubmit={handleSubmit}>
          {/* Form fields pre-filled with state values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="editFullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" id="editFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300" />
            </div>
            <div>
              <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="editEmail" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300" />
            </div>
            {/* Add the other fields (phone, birth_date, address, marital_status) here, similar to the Add form */}
          </div>

          {error && <p className="text-red-500 mt-2">{error}</p>}
          
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 border rounded-md text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 border border-transparent rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}