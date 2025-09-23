'use client';

import { useCallback, useMemo } from 'react';

// This custom hook provides a simple, consistent way to make API calls.
export function useApiClient() {

  const fetcher = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const response = await fetch(url, { ...options });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      const errorMessage = errorBody?.error || errorBody || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
    return response;
  }, []);

  const api = useMemo(() => ({
    get: async <T>(url: string): Promise<T> => {
      const response = await fetcher(url);
      return response.json();
    },

    // --- THIS IS THE FIX ---
    // The return type is now a strict `Promise<T>`.
    post: async <T>(url: string, body: any): Promise<T> => {
      const response = await fetcher(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (!text) {
        // If the body is empty, we throw an error as the caller expects a response.
        throw new Error("API returned a successful but empty response.");
      }
      return JSON.parse(text);
    },

    put: async <T>(url: string, body: any): Promise<T> => {
      const response = await fetcher(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (!text) {
        throw new Error("API returned a successful but empty response.");
      }
      return JSON.parse(text);
    },
    // --- END FIX ---

    delete: async (url: string): Promise<Response> => {
      return fetcher(url, { method: 'DELETE' });
    },
  }), [fetcher]);

  return api;
}