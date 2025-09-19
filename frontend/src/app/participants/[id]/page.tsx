'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ConfirmandDetails, Sacrament } from '@/types';

export default function ParticipantDetailPage() {
  const params = useParams();
  const participantId = params.id as string;

  const [details, setDetails] = useState<ConfirmandDetails | null>(null);
  const [allSacraments, setAllSacraments] = useState<Sacrament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participantId) return;

    async function fetchData() {
      try {
        const [detailsRes, allSacramentsRes] = await Promise.all([
          fetch(`/api/confirmands/${participantId}/details`),
          fetch('/api/sacraments'),
        ]);

        if (!detailsRes.ok || !allSacramentsRes.ok) {
          throw new Error('Failed to fetch participant details.');
        }

        const detailsData: ConfirmandDetails = await detailsRes.json();
        const allSacramentsData: Sacrament[] = await allSacramentsRes.json();

        setDetails(detailsData);
        setAllSacraments(allSacramentsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [participantId]);
  
  const handleSacramentChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!details) return;

    const sacramentId = Number(e.target.value);
    const isChecked = e.target.checked;
    
    const changedSacrament = allSacraments.find(s => s.id === sacramentId);
    if (changedSacrament) {
      if (isChecked) {
        setDetails({ ...details, sacraments: [...details.sacraments, changedSacrament] });
      } else {
        setDetails({ ...details, sacraments: details.sacraments.filter(s => s.id !== sacramentId) });
      }
    }

    try {
      const url = `/api/confirmands/${participantId}/sacraments`;
      let response;
      if (isChecked) {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sacrament_id: sacramentId }),
        });
      } else {
        response = await fetch(`${url}/${sacramentId}`, {
          method: 'DELETE',
        });
      }
      if (!response.ok) throw new Error('Failed to update sacrament status.');
    } catch (err: any) {
      setError('Error updating sacrament. Please refresh and try again.');
    }
  };

  if (loading) return <p className="text-center p-8">Loading participant details...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!details) return <p className="text-center p-8">Participant not found.</p>;
  
  const completedSacraments = new Set(details.sacraments.map(s => s.id));

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/" className="text-indigo-600 hover:underline">&larr; Back to All Participants</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- MODIFICATION: Main content area now displays all fields --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">{details.full_name}</h1>
          
          {/* Personal Details Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Personal Details</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-600">
              <p><strong>Email:</strong> {details.email}</p>
              <p><strong>Phone:</strong> {details.phone_number}</p>
              <p><strong>Birth Date:</strong> {new Date(details.birth_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
              <p><strong>Address:</strong> {details.address}</p>
              <p><strong>Marital Status:</strong> {details.marital_status}</p>
              <p><strong>Registered On:</strong> {new Date(details.creation_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Additional Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-600">
              <p><strong>Father's Name:</strong> {details.father_name || <span className="text-gray-400">N/A</span>}</p>
              <p><strong>Mother's Name:</strong> {details.mother_name || <span className="text-gray-400">N/A</span>}</p>
              <p><strong>Church of Baptism:</strong> {details.baptism_church || <span className="text-gray-400">N/A</span>}</p>
              <p><strong>Church of First Communion:</strong> {details.communion_church || <span className="text-gray-400">N/A</span>}</p>
            </div>
          </div>
        </div>
        {/* --- END MODIFICATION --- */}

        {/* Right Side: Sacrament Checklist (unchanged) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Sacraments</h2>
          <fieldset className="space-y-4">
            <legend className="sr-only">Sacraments</legend>
            {allSacraments.map(sacrament => (
              <div key={sacrament.id} className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id={`sacrament-${sacrament.id}`}
                    type="checkbox"
                    value={sacrament.id}
                    checked={completedSacraments.has(sacrament.id)}
                    onChange={handleSacramentChange}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor={`sacrament-${sacrament.id}`} className="font-medium text-gray-900">
                    {sacrament.name}
                  </label>
                </div>
              </div>
            ))}
          </fieldset>
        </div>
      </div>
    </main>
  );
}