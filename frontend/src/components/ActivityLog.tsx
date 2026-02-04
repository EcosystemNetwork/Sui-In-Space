import React, { useRef, useEffect } from 'react';
import anime from 'animejs';

/**
 * Activity Log Component
 * Shows recent game activity events
 * Enhanced with anime.js animations and futuristic HUD styling
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
  mission: 'text-[#ff9500]',
  battle: 'text-[#ff2d55]',
  levelup: 'text-[#00ff9d]',
  reward: 'text-[#00f0ff]',
  purchase: 'text-[#ff9500]',
  stake: 'text-[#bf5af2]',
  governance: 'text-[#0080ff]',
};

interface ActivityLogProps {
  maxEvents?: number;
  compact?: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ maxEvents = 5, compact = false }) => {
  const events = DEMO_EVENTS.slice(0, maxEvents);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  
  // Animate entries on mount
  useEffect(() => {
    if (eventsRef.current) {
      const eventItems = eventsRef.current.querySelectorAll('.event-item');
      anime({
        targets: eventItems,
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80, { start: 100 }),
        easing: 'easeOutCubic',
      });
    }
  }, []);

  return (
    <div ref={containerRef} className={`hud-panel hud-corners hud-corners-bottom rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-display font-bold text-[#00f0ff] flex items-center gap-2 tracking-wider uppercase ${compact ? 'text-sm' : 'text-lg'}`}>
          <span>📋</span>
          Activity Log
        </h3>
        {!compact && (
          <button className="text-xs text-[#00f0ff]/50 hover:text-[#00f0ff] transition-colors font-mono">
            View All →
          </button>
        )}
      </div>

      <div ref={eventsRef} className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className={`event-item flex items-start gap-3 ${compact ? 'p-2' : 'p-3'} rounded bg-[#001020]/60 border border-[#00f0ff]/10 hover:border-[#00f0ff]/30 transition-all cursor-pointer group`}
            style={{ opacity: 0 }}
          >
            <span className={compact ? 'text-base' : 'text-xl'}>{EVENT_ICONS[event.type]}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-[#e0f7ff] ${compact ? 'text-xs' : 'text-sm'} truncate`}>{event.message}</div>
              {event.details && (
                <div className={`${EVENT_COLORS[event.type]} ${compact ? 'text-xs' : 'text-sm'} font-display font-bold`}>
                  {event.details}
                </div>
              )}
            </div>
            <div className={`text-[#00f0ff]/40 ${compact ? 'text-xs' : 'text-xs'} whitespace-nowrap font-mono`}>
              {event.timestamp}
            </div>
          </div>
        ))}
      </div>

      {!compact && events.length === 0 && (
        <div className="text-center text-[#00f0ff]/40 py-8">
          <div className="text-3xl mb-2">📭</div>
          <p className="font-mono text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
