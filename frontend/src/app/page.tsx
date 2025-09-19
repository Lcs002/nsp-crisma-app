'use client'; // This directive is needed for using hooks like useState and useEffect

import { useState, useEffect } from 'react';

// Define a type for our API response for type safety
type HealthStatus = {
  status: string;
};

export default function Home() {
  // Use the type with useState for better autocompletion and error checking
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The fetch call is the same, but how we handle the data is now type-safe
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data: HealthStatus) => {
        setHealth(data);
      })
      .catch((err) => {
        console.error("Failed to fetch API status:", err);
        setError(err.message);
      });
  }, []); // The empty dependency array means this effect runs once on mount

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Crisma App Status</h1>
        <div className="text-2xl p-4 border rounded-lg">
          {error && <p className="text-red-500">Error: {error}</p>}
          {!error && health ? (
            <p>
              Backend API Status:{' '}
              <span className="font-mono bg-gray-200 text-green-700 p-1 rounded">
                {health.status}
              </span>
            </p>
          ) : (
            <p className="text-gray-500">Loading status...</p>
          )}
        </div>
      </div>
    </main>
  );
}