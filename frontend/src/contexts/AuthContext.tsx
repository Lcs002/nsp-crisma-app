'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/types'; // We'll need to add the User type
import { usePathname, useRouter } from 'next/navigation';

// Define the shape of the context's value
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// Create the context with a default value of undefined
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The AuthProvider component that will wrap our application
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to check auth status
  const router = useRouter();
  const pathname = usePathname();

  // This effect runs on startup to check if a user session already exists
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // We use a simple `fetch` here because our `useApiClient` is a hook
        // and cannot be used at the top level of the context.
  const response = await fetch('/api/auth/me', { credentials: 'include' });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthStatus();
  }, []);

  // Redirect logic: This effect runs when the user state or path changes
  useEffect(() => {
    // If we're still loading, don't do anything
    if (isLoading) {
      return;
    }
    
    const isAuthPage = pathname === '/login';

    // If the user is NOT logged in and is trying to access a protected page
    if (!user && !isAuthPage) {
      router.push('/login');
    }

    // If the user IS logged in and is on the login page
    if (user && isAuthPage) {
      router.push('/home'); // Redirect them to the dashboard
    }

  }, [user, isLoading, pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
        // Tell the backend to clear the session cookie
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
        console.error("Error during logout:", error);
    } finally {
        // Clear the user state and redirect to the login page
        setUser(null);
        router.push('/login');
    }
  };

  const value = { user, isLoading, login, logout };

  // While checking the initial auth status, we can show a loading screen or nothing
  // to prevent a flash of the login page for already authenticated users.
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900"><p className="text-gray-500 dark:text-gray-400">Loading Session...</p></div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily use the auth context in other components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}