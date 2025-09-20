'use client'; // This must be a Client Component to use Clerk's hooks and components

import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800/50 shadow-md backdrop-blur-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700/50">
      <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* The main app logo/link now navigates to the logged-in home page */}
        <Link href="/home" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          Crisma App
        </Link>
        <div className="flex items-center gap-6">
          
          {/* These navigation links only appear when a user is signed in */}
          <SignedIn>
            <Link href="/participants" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
              Participants
            </Link>
            <Link href="/catechists" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
              Catechists
            </Link>
            <Link href="/groups" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
              Groups
            </Link>
            {/* The UserButton directs to the public landing page after sign-out */}
            <UserButton afterSignOutUrl="/"/>
          </SignedIn>
          
          {/* This link appears when no user is signed in */}
          <SignedOut>
              <Link href="/sign-in" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                  Sign In
              </Link>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}