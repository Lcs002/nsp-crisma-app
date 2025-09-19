'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link'; // --- NEW --- Import Link
import { ConfirmationGroup, Catechist } from '@/types';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<ConfirmationGroup[]>([]);
  const [catechists, setCatechists] = useState<Catechist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState(1);
  const [catechistId, setCatechistId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState('Sunday');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupsRes, catechistsRes] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/catechists'),
        ]);

        if (!groupsRes.ok || !catechistsRes.ok) {
          throw new Error('Failed to fetch required data.');
        }

        const groupsData: ConfirmationGroup[] = await groupsRes.json();
        const catechistsData: Catechist[] = await catechistsRes.json();
        
        setGroups(groupsData);
        setCatechists(catechistsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newGroupPayload = {
      module: Number(module),
      catechist_id: catechistId ? Number(catechistId) : null,
      day_of_the_week: dayOfWeek,
      start_date: startDate,
      group_link: null,
      end_date: null,
    };

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroupPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add group.');
      }

      const createdGroup: ConfirmationGroup = await response.json();
      setGroups(prev => [createdGroup, ...prev]);

      setModule(1);
      setCatechistId('');
      setDayOfWeek('Sunday');
      setStartDate('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Manage Groups</h1>
          
          {loading && <p className="text-center text-gray-500">Loading groups...</p>}
          {error && !loading && <p className="text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</p>}
          
          {!loading && (
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3 px-6">Module</th>
                    <th scope="col" className="py-3 px-6">Catechist</th>
                    <th scope="col" className="py-3 px-6">Day</th>
                    <th scope="col" className="py-3 px-6">Start Date</th>
                    <th scope="col" className="py-3 px-6">View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{g.module}</td>
                      <td className="py-4 px-6">{g.catechist_name || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="py-4 px-6">{g.day_of_the_week}</td>
                      <td className="py-4 px-6">{formatDate(g.start_date)}</td>
                      {/* --- MODIFICATION HERE --- */}
                      <td className="py-4 px-6">
                        <Link href={`/groups/${g.id}`} className="font-medium text-indigo-600 hover:underline">
                          View & Manage
                        </Link>
                      </td>
                      {/* --- END MODIFICATION --- */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <form onSubmit={handleAddGroup} className="p-6 bg-white rounded-lg shadow-md sticky top-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add New Group</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="module" className="block text-sm font-medium text-gray-700">Module</label>
                <input type="number" id="module" value={module} onChange={(e) => setModule(Number(e.target.value))} required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div>
                <label htmlFor="catechist" className="block text-sm font-medium text-gray-700">Assign Catechist</label>
                <select id="catechist" value={catechistId} onChange={(e) => setCatechistId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                  <option value="">-- None --</option>
                  {catechists.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">Meeting Day</label>
                <select id="dayOfWeek" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                  {days.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
            </div>
            {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
            <div className="mt-6">
              <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
                {isSubmitting ? 'Adding...' : 'Add Group'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}