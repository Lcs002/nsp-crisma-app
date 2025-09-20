'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { ConfirmationGroup, Catechist } from '@/types';
import SearchableDropdown from '../components/SearchableDropdown';
import { getGroupLabel } from '@/lib/utils';
import { useApiClient } from '@/lib/useApiClient';

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
  const api = useApiClient();
  const [groups, setGroups] = useState<ConfirmationGroup[]>([]);
  const [catechists, setCatechists] = useState<Catechist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCatechist, setFilterCatechist] = useState<{ id: number; name: string } | null>(null);
  const [filterDay, setFilterDay] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterModule, setFilterModule] = useState('');

  const [module, setModule] = useState<string>('1');
  const [selectedCatechist, setSelectedCatechist] = useState<{ id: number; name: string } | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState('Sunday');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupsData, catechistsData] = await Promise.all([
          api.get<ConfirmationGroup[]>('/api/groups'),
          api.get<Catechist[]>('/api/catechists'),
        ]);
        setGroups(groupsData);
        setCatechists(catechistsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching group data.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [api]);

  const filteredGroups = useMemo(() => {
    return groups
      .filter(group => {
        if (filterCatechist && group.catechist_id !== filterCatechist.id) return false;
        if (filterDay && group.day_of_the_week !== filterDay) return false;
        if (filterDate && new Date(group.start_date) < new Date(filterDate)) return false;
        if (filterModule && group.module !== Number(filterModule)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [groups, filterCatechist, filterDay, filterDate, filterModule]);

  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const newGroupPayload = {
      module: 1, // Defaulting module to 1 as per business change
      catechist_id: selectedCatechist ? selectedCatechist.id : null,
      day_of_the_week: dayOfWeek,
      start_date: startDate,
      group_link: null,
      end_date: null,
    };
    try {
      const createdGroup = await api.post<ConfirmationGroup>('/api/groups', newGroupPayload);
      setGroups(prev => [createdGroup, ...prev]);
      setSelectedCatechist(null);
      setDayOfWeek('Sunday');
      setStartDate('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while adding the group.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const modules = ['1', '2', '3'];
  const catechistItems = catechists.map(c => ({ id: c.id, name: c.full_name }));

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Manage Groups</h1>

          <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="filterCatechist" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Catechist</label>
                <SearchableDropdown 
                  items={catechistItems}
                  selected={filterCatechist}
                  setSelected={setFilterCatechist}
                  placeholder="All Catechists"
                />
              </div>
              <div>
                <label htmlFor="filterDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Day</label>
                <select id="filterDay" value={filterDay} onChange={(e) => setFilterDay(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">All Days</option>
                  {days.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filterModule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Module</label>
                <select id="filterModule" value={filterModule} onChange={(e) => setFilterModule(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">All Modules</option>
                  {modules.map(m => <option key={m} value={m}>{`Module ${m}`}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Starts On or After</label>
                <div className="flex items-center">
                  <input type="date" id="filterDate" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} 
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                  {filterDate && <button onClick={() => setFilterDate('')} className="ml-2 text-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" title="Clear date filter">&times;</button>}
                </div>
              </div>
            </div>
          </div>
          
          {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading groups...</p>}
          {error && !loading && <p className="text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md">Error: {error}</p>}
          
          {!loading && (
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="py-3 px-6">Group</th>
                    <th scope="col" className="py-3 px-6">Catechist</th>
                    <th scope="col" className="py-3 px-6">Day</th>
                    <th scope="col" className="py-3 px-6">Start Date</th>
                    <th scope="col" className="py-3 px-6">View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((g) => (
                    <tr key={g.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{getGroupLabel(g.start_date)}</td>
                      <td className="py-4 px-6">{g.catechist_name || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="py-4 px-6">{g.day_of_the_week}</td>
                      <td className="py-4 px-6">{formatDate(g.start_date)}</td>
                      <td className="py-4 px-6">
                        <Link href={`/groups/${g.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                          View & Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredGroups.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                  No groups found matching your filters.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <form onSubmit={handleAddGroup} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md sticky top-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Add New Group</h2>
            <div className="space-y-4">
              <div>
                {/* --- THIS IS THE CORRECTED LINE --- */}
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Day</label>
                <select id="dayOfWeek" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  {days.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="catechist" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Catechist</label>
                <SearchableDropdown
                  items={catechistItems}
                  selected={selectedCatechist}
                  setSelected={setSelectedCatechist}
                  placeholder="-- None --"
                />
              </div>
            </div>
            {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
            <div className="mt-6">
              <button type="submit" disabled={isSubmitting} 
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                {isSubmitting ? 'Adding...' : 'Add Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}