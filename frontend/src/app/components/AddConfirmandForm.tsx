'use client';

import { useState, FormEvent } from 'react';
import { Confirmand } from '@/types';
import { useApiClient } from '@/lib/useApiClient'; 

interface AddConfirmandFormProps {
  onConfirmandAdded: (newConfirmand: Confirmand) => void;
}

export default function AddConfirmandForm({ onConfirmandAdded }: AddConfirmandFormProps) {
  const api = useApiClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [baptismChurch, setBaptismChurch] = useState('');
  const [communionChurch, setCommunionChurch] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!api) return;
    setIsSubmitting(true);
    setError(null);

    const newConfirmandPayload = {
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
      const createdConfirmand = await api.post<Confirmand>('/api/confirmands', newConfirmandPayload);
      onConfirmandAdded(createdConfirmand);

      setFullName('');
      setEmail('');
      setPhone('');
      setBirthDate('');
      setAddress('');
      setMaritalStatus('Single');
      setFatherName('');
      setMotherName('');
      setBaptismChurch('');
      setCommunionChurch('');

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while adding the participant.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Add New Participant</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        
        <h3 className="md:col-span-2 text-lg font-medium text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Personal Information</h3>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</label>
          <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} required 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
          <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
          />
        </div>
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
          <select id="maritalStatus" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} required 
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
            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Father&apos;s Full Name</label>
            <input type="text" id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
            {/* --- FIX IS HERE --- */}
            <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mother&apos;s Full Name</label>
            <input type="text" id="motherName" value={motherName} onChange={(e) => setMotherName(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
            <label htmlFor="baptismChurch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Church of Baptism</label>
            <input type="text" id="baptismChurch" value={baptismChurch} onChange={(e) => setBaptismChurch(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
            <label htmlFor="communionChurch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Church of First Communion</label>
            <input type="text" id="communionChurch" value={communionChurch} onChange={(e) => setCommunionChurch(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}

      <div className="mt-6">
        <button type="submit" disabled={isSubmitting} 
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {isSubmitting ? 'Adding...' : 'Add Participant'}
        </button>
      </div>
    </form>
  );
}