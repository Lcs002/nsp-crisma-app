import { useAuth } from '@clerk/nextjs';
import { useCallback, useMemo } from 'react';

// This custom hook provides an authenticated API client.
export function useApiClient() {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    // --- THIS IS THE DEFINITIVE FIX ---
    // We must explicitly ask for the token from our custom template.
    // Replace 'default-vercel-with-roles' with the actual name of your JWT template.
    const token = await getToken({ template: 'Vercel' });
    // --- END FIX ---

    if (!token) {
        throw new Error("User is not authenticated or token is unavailable. Cannot make API call.");
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || `Request failed with status ${response.status}`);
    }
    return response;
  }, [getToken]);

  const api = useMemo(() => ({
    get: async <T>(url: string): Promise<T> => {
      const response = await fetchWithAuth(url);
      return response.json();
    },
    post: async <T>(url: string, body: any): Promise<T> => {
      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.json();
    },
    put: async <T>(url: string, body: any): Promise<T> => {
      const response = await fetchWithAuth(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.json();
    },
    delete: async (url: string): Promise<Response> => {
      return fetchWithAuth(url, { method: 'DELETE' });
    },
  }), [fetchWithAuth]);

  return api;
}