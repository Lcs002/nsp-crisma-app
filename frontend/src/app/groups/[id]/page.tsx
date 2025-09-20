'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ConfirmationGroupDetails, Confirmand } from '@/types';
import SearchableDropdown from '../../components/SearchableDropdown';
import { useApiClient } from '@/lib/useApiClient';
import { getGroupLabel } from '@/lib/utils';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const api = useApiClient();

  const [groupDetails, setGroupDetails] = useState<ConfirmationGroupDetails | null>(null);
  const [allParticipants, setAllParticipants] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantToAdd, setParticipantToAdd] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (!groupId || !api) return;
    async function fetchData() {
      try {
        const [groupData, participantsData] = await Promise.all([
          api.get<ConfirmationGroupDetails>(`/api/groups/${groupId}`),
          api.get<Confirmand[]>('/api/confirmands'),
        ]);
        setGroupDetails(groupData);
        setAllParticipants(participantsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching group details.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [groupId, api]);

  const availableParticipantItems = useMemo(() => {
    if (!groupDetails) return [];
    return allParticipants
      .filter(p => !groupDetails.members.some(member => member.id === p.id))
      .map(p => ({ id: p.id, name: p.full_name }));
  }, [allParticipants, groupDetails]);

  const handleAddParticipant = async (e: FormEvent) => {
    e.preventDefault();
    if (!participantToAdd || !api) {
      alert('Please select a participant to add.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/api/groups/${groupId}/participants`, { confirmand_id: participantToAdd.id });
      const addedParticipant = allParticipants.find(p => p.id === participantToAdd.id);
      if (addedParticipant && groupDetails) {
        setGroupDetails({
          ...groupDetails,
          members: [...groupDetails.members, addedParticipant].sort((a,b) => a.full_name.localeCompare(b.full_name)),
        });
      }
      setParticipantToAdd(null);
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

  const handleRemoveParticipant = async (participantId: number) => {
    if (!api || !window.confirm("Are you sure you want to remove this participant from the group?")) return;
    try {
        await api.delete(`/api/groups/${groupId}/participants/${participantId}`);
        if (groupDetails) {
            setGroupDetails({
                ...groupDetails,
                members: groupDetails.members.filter(member => member.id !== participantId),
            });
        }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while removing the participant.");
      }
    }
  };

  if (loading) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading group details...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!groupDetails) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Group not found.</p>;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/groups" className="text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to All Groups</Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {getGroupLabel(groupDetails.start_date)}
        </h1>
        <div className="mt-2 text-gray-600 dark:text-gray-300 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><strong>Catechist:</strong> {groupDetails.catechist_name || 'Unassigned'}</div>
          <div><strong>Meeting Day:</strong> {groupDetails.day_of_the_week}</div>
          <div><strong>Start Date:</strong> {formatDate(groupDetails.start_date)}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Group Members ({groupDetails.members.length})</h2>
          <div className="overflow-x-auto relative bg-white dark:bg-gray-800 shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="py-3 px-6">Full Name</th>
                  <th scope="col" className="py-3 px-6">Email</th>
                  <th scope="col" className="py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupDetails.members.map(member => (
                  <tr key={member.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{member.full_name}</td>
                    <td className="py-4 px-6">{member.email}</td>
                    <td className="py-4 px-6">
                        <button 
                          onClick={() => handleRemoveParticipant(member.id)}
                          className="font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                            Remove
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <form onSubmit={handleAddParticipant} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md sticky top-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Add Participant</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="participant" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Participant</label>
                <SearchableDropdown
                  items={availableParticipantItems}
                  selected={participantToAdd}
                  setSelected={setParticipantToAdd}
                  placeholder="-- Search for a participant --"
                />
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={isSubmitting} 
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                {isSubmitting ? 'Adding...' : 'Add to Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}