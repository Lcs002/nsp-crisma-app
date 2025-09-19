'use client';

import { useState, FormEvent } from 'react';
import { Confirmand } from '@/types';

interface AddConfirmandFormProps {
  // This is a callback function to notify the parent page when a new participant is added
  onConfirmandAdded: (newConfirmand: Confirmand) => void;
}

export default function AddConfirmandForm({ onConfirmandAdded }: AddConfirmandFormProps) {
  // State for each form field
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single'); // Default to 'Single'

  // State for handling submission and errors
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent the default form submission (page reload)
    setIsSubmitting(true);
    setError(null);

    // This payload's keys MUST exactly match the Rust `CreateConfirmand` struct fields
    const newConfirmandPayload = {
      full_name: fullName,
      email: email,
      phone_number: phone,
      birth_date: birthDate, // HTML input type="date" provides "YYYY-MM-DD" string
      address: address,
      marital_status: maritalStatus, // e.g., "Married - Church"
    };

    try {
      const response = await fetch('/api/confirmands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfirmandPayload),
      });

      // Handle backend errors (like 422 or 500)
      if (!response.ok) {
        const errorText = await response.text(); // Get the plain text error from Rust
        console.error("Backend Error:", errorText);
        throw new Error(errorText || 'Failed to add participant.');
      }

      // If successful, parse the newly created participant from the response
      const createdConfirmand: Confirmand = await response.json();
      
      // Call the parent component's function to update the main list
      onConfirmandAdded(createdConfirmand);

      // Reset the form fields for the next entry
      setFullName('');
      setEmail('');
      setPhone('');
      setBirthDate('');
      setAddress('');
      setMaritalStatus('Single');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false); // Re-enable the submit button
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add New Participant</h2>
      
      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Birth Date</label>
          <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        {/* Marital Status Dropdown */}
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">Marital Status</label>
          <select id="maritalStatus" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="Single">Single</option>
            <option value="Married - Church">Married - Church</option>
            <option value="Married - Civil">Married - Civil</option>
            <option value="Union">Union</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>
      </div>

      {/* Error Message Display */}
      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}

      {/* Submit Button */}
      <div className="mt-6">
        <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
          {isSubmitting ? 'Adding...' : 'Add Participant'}
        </button>
      </div>
    </form>
  );
}