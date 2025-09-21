'use client'; // This must be a Client Component to use the SignedIn/SignedOut components

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <main 
      className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center text-center" 
      // This style ensures the content is centered vertically in the space below the header
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-gray-100">
        Welcome to the Crisma App
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
        Your central place for managing participants, groups, and catechists involved in the confirmation process.
      </p>
      
      <div className="mt-8">
        <SignedIn>
          {/* If the user is already signed in, show a button to go directly to the dashboard */}
          <Link 
            href="/home" 
            className="inline-block px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Go to Home Dashboard
          </Link>
        </SignedIn>
        
        <SignedOut>
          {/* If the user is signed out, show a button to prompt them to sign in */}
          <Link 
            href="/sign-in" 
            className="inline-block px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Sign In to Get Started
          </Link>
        </SignedOut>
      </div>
    </main>
  );
}