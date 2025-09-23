'use client'; // This must be a Client Component to use our custom auth hook

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext'; // Import our own auth hook

export default function LandingPage() {
  // Get the user and loading state from our context
  const { user, isLoading } = useAuth();

  // While the auth status is being checked on initial load, we can show a neutral state
  if (isLoading) {
    return (
        <main 
            className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center text-center" 
            style={{ minHeight: 'calc(100vh - 80px)' }}
        >
            <div className="animate-pulse text-gray-500">Loading...</div>
        </main>
    );
  }

  return (
    <main 
      className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center text-center" 
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-gray-100">
        Welcome to the Crisma App
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
        Your central place for managing participants, groups, and catechists involved in the confirmation process.
      </p>
      
      <div className="mt-8">
        {/* --- MODIFICATION: Logic now uses our `user` state object --- */}
        {user ? (
          // If the user object exists, they are signed in
          <Link 
            href="/home" 
            className="inline-block px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Go to Home Dashboard
          </Link>
        ) : (
          // If the user object is null, they are signed out
          <Link 
            href="/login" 
            className="inline-block px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Sign In to Get Started
          </Link>
        )}
      </div>
    </main>
  );
}