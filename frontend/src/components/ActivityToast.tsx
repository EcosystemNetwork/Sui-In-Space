import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animate } from 'animejs';
import { useLiveData } from '../hooks/useLiveData';
import type { ActivityEntry } from '../hooks/useAgentActivity';

interface Toast {
  id: string;
  entry: ActivityEntry;
  exiting: boolean;
}

const MAX_TOASTS = 4;
const DISMISS_MS = 6000;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  // Slide-in on mount
  useEffect(() => {
    if (ref.current) {
      animate(ref.current, {
        translateX: [80, 0],
        opacity: [0, 1],
        duration: 350,
        easing: 'easeOutCubic',
      });
    }
  }, []);

  // Fade-out when exiting
  useEffect(() => {
    if (toast.exiting && ref.current) {
      animate(ref.current, {
        translateX: [0, 80],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInCubic',
      });
    }
  }, [toast.exiting]);

  const isCyan = toast.entry.agent === 'NEXUS-7';
  const time = new Date(toast.entry.timestamp).toLocaleTimeString();

  return (
    <div
      ref={ref}
      onClick={() => onDismiss(toast.id)}
      className="w-80 p-3 rounded-lg bg-slate-900/95 border border-slate-700 shadow-lg shadow-black/40 cursor-pointer hover:border-slate-600 transition-colors"
      style={{ opacity: 0 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${toast.entry.success ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
          isCyan ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {toast.entry.agent}
        </span>
        <span className="text-xs text-slate-500 font-mono ml-auto">{time}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
          className="text-slate-500 hover:text-slate-300 text-xs leading-none ml-1"
        >
          &times;
        </button>
      </div>
      <div className="text-sm text-slate-300 truncate">
        <span className="font-semibold text-slate-200">{toast.entry.action}</span>
        {' — '}
        {toast.entry.description}
      </div>
      {toast.entry.txDigest && (
        <a
          href={`https://suiscan.xyz/testnet/tx/${toast.entry.txDigest}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
        >
          View tx
        </a>
      )}
    </div>
  );
}

export const ActivityToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activity } = useLiveData();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevCountRef = useRef<number>(-1);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Detect new entries by count diff
  useEffect(() => {
    // Skip until we actually have data (initial state is [])
    if (activity.length === 0) return;

    // First time we see real data — just record the baseline, don't toast
    if (prevCountRef.current === -1) {
      prevCountRef.current = activity.length;
      return;
    }

    const prevCount = prevCountRef.current;
    const currentCount = activity.length;

    if (currentCount > prevCount) {
      const newEntries = activity.slice(prevCount);
      const newToasts: Toast[] = newEntries.map((entry, i) => ({
        id: `${Date.now()}-${i}`,
        entry,
        exiting: false,
      }));

      setToasts(prev => {
        const combined = [...prev, ...newToasts];
        // If over max, drop oldest
        if (combined.length > MAX_TOASTS) {
          return combined.slice(combined.length - MAX_TOASTS);
        }
        return combined;
      });
    }

    prevCountRef.current = currentCount;
  }, [activity]);

  // Set auto-dismiss timers for each toast
  useEffect(() => {
    for (const toast of toasts) {
      if (!toast.exiting && !timersRef.current.has(toast.id)) {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, DISMISS_MS);
        timersRef.current.set(toast.id, timer);
      }
    }
  }, [toasts]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    // Mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }, 300);
  }, []);

  return (
    <>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </>
  );
};
