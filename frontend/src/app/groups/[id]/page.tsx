'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConfirmationGroupDetails, Confirmand } from '@/types';

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
  const router = useRouter();
  const groupId = params.id as string; // Assert as string for easier use

  const [groupDetails, setGroupDetails] = useState<ConfirmationGroupDetails | null>(null);
  const [allParticipants, setAllParticipants] = useState<Confirmand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantToAdd, setParticipantToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    async function fetchData() {
      try {
        const [groupRes, participantsRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch('/api/confirmands'),
        ]);

        if (!groupRes.ok || !participantsRes.ok) {
          throw new Error('Failed to fetch group details.');
        }

        const groupData: ConfirmationGroupDetails = await groupRes.json();
        const participantsData: Confirmand[] = await participantsRes.json();

        setGroupDetails(groupData);
        setAllParticipants(participantsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [groupId]);

  const handleAddParticipant = async (e: FormEvent) => {
    e.preventDefault();
    if (!participantToAdd) {
      alert('Please select a participant to add.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmand_id: Number(participantToAdd) }),
      });

      if (!response.ok) throw new Error(await response.text());
      
      const addedParticipant = allParticipants.find(p => p.id === Number(participantToAdd));
      if (addedParticipant && groupDetails) {
        setGroupDetails({
          ...groupDetails,
          members: [...groupDetails.members, addedParticipant].sort((a,b) => a.full_name.localeCompare(b.full_name)),
        });
      }
      setParticipantToAdd('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW --- Handler for Removing a Participant --- NEW ---
  const handleRemoveParticipant = async (participantId: number) => {
    if (!window.confirm("Are you sure you want to remove this participant from the group?")) {
        return;
    }

    try {
        const response = await fetch(`/api/groups/${groupId}/participants/${participantId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // Update the UI instantly by filtering the member out of the list
        if (groupDetails) {
            setGroupDetails({
                ...groupDetails,
                members: groupDetails.members.filter(member => member.id !== participantId),
            });
        }
    } catch (err: any) {
        setError(err.message);
    }
  };

  if (loading) return <p className="text-center p-8">Loading group details...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!groupDetails) return <p className="text-center p-8">Group not found.</p>;

  const availableParticipants = allParticipants.filter(p => 
    !groupDetails.members.some(member => member.id === p.id)
  );

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/groups" className="text-indigo-600 hover:underline">&larr; Back to All Groups</Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Module {groupDetails.module}</h1>
        <div className="mt-2 text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><strong>Catechist:</strong> {groupDetails.catechist_name || 'Unassigned'}</div>
          <div><strong>Meeting Day:</strong> {groupDetails.day_of_the_week}</div>
          <div><strong>Start Date:</strong> {formatDate(groupDetails.start_date)}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Group Members ({groupDetails.members.length})</h2>
          <div className="overflow-x-auto relative bg-white shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="py-3 px-6">Full Name</th>
                  <th scope="col" className="py-3 px-6">Email</th>
                  <th scope="col" className="py-3 px-6">Actions</th> {/* --- MODIFIED HEADER --- */}
                </tr>
              </thead>
              <tbody>
                {groupDetails.members.map(member => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{member.full_name}</td>
                    <td className="py-4 px-6">{member.email}</td>
                    {/* --- NEW --- Cell for the Remove button --- NEW --- */}
                    <td className="py-4 px-6">
                        <button 
                          onClick={() => handleRemoveParticipant(member.id)}
                          className="font-medium text-red-600 hover:underline"
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
          <form onSubmit={handleAddParticipant} className="p-6 bg-white rounded-lg shadow-md sticky top-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add Participant</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="participant" className="block text-sm font-medium text-gray-700">Select Participant</label>
                <select id="participant" value={participantToAdd} onChange={e => setParticipantToAdd(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                  <option value="" disabled>-- Select a participant --</option>
                  {availableParticipants.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
                {isSubmitting ? 'Adding...' : 'Add to Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}