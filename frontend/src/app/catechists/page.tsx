'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Catechist } from '@/types'; // Import our new type

export default function CatechistsPage() {
  // State for the list of catechists
  const [catechists, setCatechists] = useState<Catechist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the "Add New Catechist" form
  const [fullName, setFullName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all catechists when the component mounts
  useEffect(() => {
    async function fetchCatechists() {
      try {
        const response = await fetch('/api/catechists');
        if (!response.ok) {
          throw new Error('Failed to fetch catechists.');
        }
        const data: Catechist[] = await response.json();
        setCatechists(data.sort((a, b) => a.full_name.localeCompare(b.full_name)));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCatechists();
  }, []);

  // Handle the form submission to create a new catechist
  const handleAddCatechist = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newCatechistPayload = {
      full_name: fullName,
      currently_active: isActive,
    };

    try {
      const response = await fetch('/api/catechists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCatechistPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add catechist.');
      }

      const createdCatechist: Catechist = await response.json();

      // Add the new catechist to the list and re-sort
      setCatechists(prev => 
        [...prev, createdCatechist].sort((a, b) => a.full_name.localeCompare(b.full_name))
      );

      // Reset form
      setFullName('');
      setIsActive(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Table of Catechists */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Manage Catechists</h1>
          
          {loading && <p className="text-center text-gray-500">Loading catechists...</p>}
          {error && !loading && <p className="text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</p>}
          
          {!loading && (
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3 px-6">Full Name</th>
                    <th scope="col" className="py-3 px-6">Status</th>
                    <th scope="col" className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catechists.map((c) => (
                    <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{c.full_name}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.currently_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {c.currently_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 flex gap-4">
                        {/* We will add Edit/Delete buttons here later */}
                        <button className="font-medium text-indigo-600 hover:underline disabled:text-gray-400" disabled>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Add Catechist Form */}
        <div>
          <form onSubmit={handleAddCatechist} className="p-6 bg-white rounded-lg shadow-md sticky top-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add New Catechist</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              
              <div className="flex items-center">
                <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Currently Active</label>
              </div>
            </div>
            
            {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
            
            <div className="mt-6">
              <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isSubmitting ? 'Adding...' : 'Add Catechist'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}