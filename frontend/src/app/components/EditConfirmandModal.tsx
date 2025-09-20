'use client';

import { useState, FormEvent } from 'react';
import { Confirmand } from '@/types';
import { useApiClient } from '@/lib/useApiClient';

interface EditConfirmandModalProps {
  confirmand: Confirmand;
  onClose: () => void;
  onConfirmandUpdated: (updatedConfirmand: Confirmand) => void;
}

export default function EditConfirmandModal({ confirmand, onClose, onConfirmandUpdated }: EditConfirmandModalProps) {
  const api = useApiClient();
  const [fullName, setFullName] = useState(confirmand.full_name);
  const [email, setEmail] = useState(confirmand.email);
  const [phone, setPhone] = useState(confirmand.phone_number);
  const [birthDate, setBirthDate] = useState(confirmand.birth_date);
  const [address, setAddress] = useState(confirmand.address);
  const [maritalStatus, setMaritalStatus] = useState(confirmand.marital_status);
  const [fatherName, setFatherName] = useState(confirmand.father_name || '');
  const [motherName, setMotherName] = useState(confirmand.mother_name || '');
  const [baptismChurch, setBaptismChurch] = useState(confirmand.baptism_church || '');
  const [communionChurch, setCommunionChurch] = useState(confirmand.communion_church || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!api) return;
    setIsSubmitting(true);
    setError(null);

    const updatedPayload = {
      full_name: fullName,
      email: email,
      phone_number: phone,
      birth_date: birthDate,
      address: address,
      marital_status: maritalStatus,
      father_name: fatherName || null,
      mother_name: motherName || null,
      baptism_church: baptismChurch || null,
      communion_church: communionChurch || null,
    };

    try {
      const updatedData = await api.put<Confirmand>(`/api/confirmands/${confirmand.id}`, updatedPayload);
      onConfirmandUpdated(updatedData);
      onClose();

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while updating the participant.");
      }
    } 
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Edit Participant</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            <h3 className="md:col-span-2 text-lg font-medium text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Personal Information</h3>
            
            <div>
              <label htmlFor="editFullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input type="text" id="editFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="editBirthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</label>
              <input type="date" id="editBirthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <input type="text" id="editAddress" value={address} onChange={(e) => setAddress(e.target.value)} required 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input type="email" id="editEmail" value={email} onChange={(e) => setEmail(e.target.value)} required 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="editPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input type="tel" id="editPhone" value={phone} onChange={(e) => setPhone(e.target.value)} required 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="editMaritalStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
              <select id="editMaritalStatus" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} required 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="Single">Single</option>
                <option value="Married - Church">Married - Church</option>
                <option value="Married - Civil">Married - Civil</option>
                <option value="Union">Union</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <h3 className="md:col-span-2 text-lg font-medium text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mt-4">Additional Information (Optional)</h3>

            <div>
              {/* --- FIX IS HERE --- */}
              <label htmlFor="editFatherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Father&apos;s Full Name</label>
              <input type="text" id="editFatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              {/* --- FIX IS HERE --- */}
              <label htmlFor="editMotherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mother&apos;s Full Name</label>
              <input type="text" id="editMotherName" value={motherName} onChange={(e) => setMotherName(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="editBaptismChurch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Church of Baptism</label>
              <input type="text" id="editBaptismChurch" value={baptismChurch} onChange={(e) => setBaptismChurch(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="editCommunionChurch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Church of First Communion</label>
              <input type="text" id="editCommunionChurch" value={communionChurch} onChange={(e) => setCommunionChurch(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>

          {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
          
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} 
              className="py-2 px-4 border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} 
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}