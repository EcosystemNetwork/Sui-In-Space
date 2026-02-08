import { useState, useEffect, useRef, useCallback } from 'react';

export interface ActivityEntry {
  timestamp: string;
  agent: string;
  phase: string;
  action: string;
  description: string;
  reasoning: string;
  txDigest: string | null;
  success: boolean;
  details?: Record<string, unknown>;
}

const POLL_INTERVAL = 8000;

export function useAgentActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/agent-activity.json');
      if (!res.ok) {
        // File doesn't exist yet — that's fine
        setEntries([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntries(data);
        setLastUpdated(new Date());
      }
    } catch {
      // File not available yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    timerRef.current = setInterval(fetchActivity, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchActivity]);

  return { entries, loading, lastUpdated, refresh: fetchActivity };
}
