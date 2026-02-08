import React, { useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Activity Log Component
 * Shows recent game activity events
 * Enhanced with anime.js animations
 */

interface ActivityEvent {
  id: string;
  type: 'mission' | 'battle' | 'levelup' | 'reward' | 'purchase' | 'stake' | 'governance';
  message: string;
  timestamp: string;
  details?: string;
}

const DEMO_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    type: 'mission',
    message: 'Mission "Data Heist Alpha" completed',
    timestamp: '2 min ago',
    details: '+500 GALACTIC',
  },
  {
    id: '2',
    type: 'levelup',
    message: 'Agent "Nova-7" leveled up',
    timestamp: '15 min ago',
    details: 'Level 15 → 16',
  },
  {
    id: '3',
    type: 'battle',
    message: 'Fleet battle victory',
    timestamp: '1 hour ago',
    details: 'Defeated "Dark Fleet"',
  },
  {
    id: '4',
    type: 'stake',
    message: 'Staked 25,000 GALACTIC',
    timestamp: '3 hours ago',
    details: 'Alpha Yield Farm',
  },
  {
    id: '5',
    type: 'reward',
    message: 'Claimed staking rewards',
    timestamp: '6 hours ago',
    details: '+1,247 GALACTIC',
  },
  {
    id: '6',
    type: 'governance',
    message: 'Voted on Proposal #47',
    timestamp: '1 day ago',
    details: 'For - 90,000 VP',
  },
  {
    id: '7',
    type: 'purchase',
    message: 'Built new ship "Cargo Whale"',
    timestamp: '2 days ago',
    details: '-25,000 GALACTIC',
  },
];

const EVENT_ICONS: Record<ActivityEvent['type'], string> = {
  mission: '📜',
  battle: '⚔️',
  levelup: '⬆️',
  reward: '🎁',
  purchase: '🛒',
  stake: '⚡',
  governance: '🏛️',
};

const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  mission: 'text-yellow-400',
  battle: 'text-red-400',
  levelup: 'text-green-400',
  reward: 'text-cyan-400',
  purchase: 'text-orange-400',
  stake: 'text-purple-400',
  governance: 'text-blue-400',
};

interface ActivityLogProps {
  maxEvents?: number;
  compact?: boolean;
  events?: ActivityEvent[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ maxEvents = 5, compact = false, events: externalEvents }) => {
  const events = (externalEvents && externalEvents.length > 0 ? externalEvents : DEMO_EVENTS).slice(0, maxEvents);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  
  // Animate entries on mount
  useEffect(() => {
    if (eventsRef.current) {
      const eventItems = eventsRef.current.querySelectorAll('.event-item');
      animate(eventItems, {
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: stagger(80, { start: 100 }),
        ease: 'outCubic',
      });
    }
  }, []);

  return (
    <div ref={containerRef} className={`rounded-lg bg-slate-900/80 border border-slate-700 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-white flex items-center gap-2 ${compact ? 'text-sm' : 'text-lg'}`}>
          <span className="text-cyan-400">📋</span>
          Activity Log
        </h3>
        {!compact && (
          <button className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
            View All →
          </button>
        )}
      </div>

      <div ref={eventsRef} className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className={`event-item flex items-start gap-3 ${compact ? 'p-2' : 'p-3'} rounded bg-slate-800/50 hover:bg-slate-800/80 transition-colors cursor-pointer`}
            style={{ opacity: 0 }}
          >
            <span className={compact ? 'text-base' : 'text-xl'}>{EVENT_ICONS[event.type]}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-white ${compact ? 'text-xs' : 'text-sm'} truncate`}>{event.message}</div>
              {event.details && (
                <div className={`${EVENT_COLORS[event.type]} ${compact ? 'text-xs' : 'text-sm'} font-medium`}>
                  {event.details}
                </div>
              )}
            </div>
            <div className={`text-slate-500 ${compact ? 'text-xs' : 'text-xs'} whitespace-nowrap`}>
              {event.timestamp}
            </div>
          </div>
        ))}
      </div>

      {!compact && events.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          <div className="text-3xl mb-2">📭</div>
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
