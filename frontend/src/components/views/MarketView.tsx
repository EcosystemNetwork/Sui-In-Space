import React, { useState, useRef, useEffect } from 'react';
import anime from 'animejs';

/**
 * Market View Component
 * Galactic Exchange - trading and marketplace
 * Designed with Space Command theme matching gameart.png
 */

interface MarketItem {
  id: string;
  name: string;
  category: 'resources' | 'modules' | 'augments' | 'ships';
  icon: string;
  price: number;
  change24h: number;
  volume24h: number;
  available: number;
}

const MARKET_ITEMS: MarketItem[] = [
  { id: '1', name: 'Rare Ore', category: 'resources', icon: '💎', price: 150, change24h: 5.2, volume24h: 125000, available: 5420 },
  { id: '2', name: 'Energy Cells', category: 'resources', icon: '⚡', price: 25, change24h: -2.1, volume24h: 890000, available: 45000 },
  { id: '3', name: 'Quantum Core', category: 'modules', icon: '🧠', price: 12500, change24h: 12.5, volume24h: 45000, available: 23 },
  { id: '4', name: 'Plasma Cannon', category: 'modules', icon: '🔫', price: 8000, change24h: 0.8, volume24h: 28000, available: 156 },
  { id: '5', name: 'Neural Implant', category: 'augments', icon: '🔌', price: 5500, change24h: -1.2, volume24h: 18000, available: 89 },
  { id: '6', name: 'Stealth Module', category: 'modules', icon: '👁️', price: 15000, change24h: 8.9, volume24h: 12000, available: 12 },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'resources', name: 'Resources', icon: '💎' },
  { id: 'modules', name: 'Modules', icon: '🔧' },
  { id: 'augments', name: 'Augments', icon: '🔌' },
  { id: 'ships', name: 'Ships', icon: '🚀' },
];

export const MarketView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'sell' | 'orders'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const filteredItems = selectedCategory === 'all' 
    ? MARKET_ITEMS 
    : MARKET_ITEMS.filter(item => item.category === selectedCategory);

  // Initial entrance animations
  useEffect(() => {
    if (headerRef.current) {
      anime({
        targets: headerRef.current,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutCubic',
      });
    }
    
    if (statsRef.current) {
      const statCards = statsRef.current.querySelectorAll('.stat-card');
      anime({
        targets: statCards,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80, { start: 200 }),
        easing: 'easeOutCubic',
      });
    }
  }, []);
  
  // Animate content when tab/category changes
  useEffect(() => {
    if (contentRef.current) {
      anime({
        targets: contentRef.current,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutCubic',
      });
      
      const items = contentRef.current.querySelectorAll('.market-item');
      anime({
        targets: items,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(50, { start: 200 }),
        easing: 'easeOutCubic',
      });
    }
  }, [activeTab, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
          <span className="text-energy-gold">💱</span>
          Galactic Exchange
        </h2>
        <div className="flex gap-2">
          {['browse', 'sell', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'browse' | 'sell' | 'orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-energy-gold/20 text-energy-gold border border-energy-gold/50'
                  : 'space-btn text-metallic-silver'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Market Stats */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card space-panel p-3 rounded-lg" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-energy-gold">$2.4M</div>
          <div className="text-xs text-metallic-silver">24h Volume</div>
        </div>
        <div className="stat-card space-panel p-3 rounded-lg" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-green-400">+4.8%</div>
          <div className="text-xs text-metallic-silver">Market Trend</div>
        </div>
        <div className="stat-card space-panel p-3 rounded-lg" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-galactic-cyan">{MARKET_ITEMS.length}</div>
          <div className="text-xs text-metallic-silver">Listed Items</div>
        </div>
        <div className="stat-card space-panel p-3 rounded-lg" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-electric-purple">156</div>
          <div className="text-xs text-metallic-silver">Active Orders</div>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div ref={contentRef} style={{ opacity: 0 }}>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  selectedCategory === category.id
                    ? 'bg-galactic-cyan/20 text-galactic-cyan border border-galactic-cyan/50'
                    : 'space-btn text-metallic-silver'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Market Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`market-item space-panel p-4 rounded-lg cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-galactic-cyan shadow-cyan-glow'
                    : 'hover:border-galactic-cyan/50'
                }`}
                style={{ opacity: 0 }}
              >
                {/* Item Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-space-border flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-metallic-silver capitalize">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-energy-gold">
                      {item.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-metallic-silver">GALACTIC</div>
                  </div>
                </div>

                {/* Item Stats */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-metallic-silver">24h: </span>
                    <span className={item.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                    </span>
                  </div>
                  <div>
                    <span className="text-metallic-silver">Vol: </span>
                    <span className="text-white">{(item.volume24h / 1000).toFixed(0)}K</span>
                  </div>
                  <div>
                    <span className="text-metallic-silver">Qty: </span>
                    <span className="text-white">{item.available.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expanded Actions */}
                {selectedItem?.id === item.id && (
                  <div className="mt-4 pt-4 border-t border-space-border flex gap-2">
                    <button className="flex-1 action-btn action-btn-primary text-sm">
                      Buy Now
                    </button>
                    <button className="flex-1 space-btn px-3 py-2 rounded-lg text-metallic-silver text-sm">
                      Place Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sell' && (
        <div ref={contentRef} className="max-w-2xl mx-auto" style={{ opacity: 0 }}>
          <div className="space-panel p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">List Item for Sale</h3>

            <div className="space-y-4">
              {/* Item Selection */}
              <div>
                <label className="block text-sm text-metallic-silver mb-2">Select Item</label>
                <div className="space-btn p-3 rounded-lg flex items-center justify-between cursor-pointer">
                  <span className="text-metallic-silver">Choose from inventory...</span>
                  <span className="text-metallic-silver">▼</span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm text-metallic-silver mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="1"
                  className="w-full p-3 rounded-lg bg-space-border border border-space-border text-white outline-none focus:border-galactic-cyan/50"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm text-metallic-silver mb-2">Price per Unit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    className="flex-1 p-3 rounded-lg bg-space-border border border-space-border text-white outline-none focus:border-galactic-cyan/50"
                  />
                  <div className="px-4 py-3 rounded-lg bg-space-border text-energy-gold font-medium">
                    GALACTIC
                  </div>
                </div>
              </div>

              {/* Fee Info */}
              <div className="p-3 rounded-lg bg-space-border/50 text-xs">
                <div className="flex justify-between text-metallic-silver mb-1">
                  <span>Marketplace Fee</span>
                  <span className="text-white">2.5%</span>
                </div>
                <div className="flex justify-between text-metallic-silver">
                  <span>You'll Receive</span>
                  <span className="text-energy-gold">0 GALACTIC</span>
                </div>
              </div>

              {/* Submit Button */}
              <button className="w-full action-btn action-btn-primary">
                📤 List Item
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div ref={contentRef} style={{ opacity: 0 }}>
          <div className="space-panel p-4 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">Your Orders</h3>
            
            <div className="text-center py-8 text-metallic-silver">
              <div className="text-4xl mb-3">📋</div>
              <p>No active orders</p>
              <p className="text-sm">Place buy or sell orders to see them here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;
