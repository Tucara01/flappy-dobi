import { useEffect, useState } from "react";

export interface NeynarUser {
  fid: number;
  score: number;
}

export function useNeynarUser(context?: { user?: { fid?: number } }) {
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!context?.user?.fid) {
      setUser(null);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    fetch(`/api/users?fids=${context.user.fid}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.users?.[0]) {
          setUser(data.users[0]);
        } else {
          setUser(null);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError('Request timeout - API not responding');
        } else if (err.message.includes('Failed to fetch')) {
          setError('Network error - API endpoint not available');
        } else {
          setError(err.message);
        }
        console.warn('useNeynarUser fetch error:', err);
        
        // Set a fallback user to prevent app from breaking
        setUser({
          fid: context.user?.fid || 0,
          score: 0
        });
      })
      .finally(() => setLoading(false));
      
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [context?.user?.fid]);

  return { user, loading, error };
} 