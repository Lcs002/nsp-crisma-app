'use client'; // This is a Client Component because it uses context and state

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext'; // Import our custom auth hook

export default function Header() {
  const { user, logout } = useAuth(); // Get the current user and logout function from our context

  return (
    <header className="bg-white dark:bg-gray-800/50 shadow-md backdrop-blur-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700/50">
      <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* The main app logo/link now navigates to the logged-in home page if logged in, or landing page if not */}
        <Link href={user ? "/home" : "/"} className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          Crisma App
        </Link>
        <div className="flex items-center gap-6">
          
          {/* --- MODIFICATION: Logic now uses our own `user` state --- */}
          {user ? (
            // If the user object exists, they are signed in
            <>
              <Link href="/participants" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                Participants
              </Link>
              <Link href="/catechists" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                Catechists
              </Link>
              <Link href="/groups" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                Groups
              </Link>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Welcome, {user.username}
                </span>
                <button 
                  onClick={logout} 
                  className="font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            // If the user object is null, they are signed out
            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}