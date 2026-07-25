import React from 'react';

export const StatsMetrics: React.FC = () => {
  const stats = [
    { label: 'On-Time Delivery Rate', value: '99.98%', desc: 'Real-time GPS telematics routing' },
    { label: 'Freight Rate Value Managed', value: '$45M+', desc: 'Multi-tier financial rate engine' },
    { label: 'GPS Broadcast Latency', value: '< 3.2s', desc: 'WebSocket live position streams' },
    { label: 'Disintermediation Privacy', value: '100%', desc: '1-Hop corporate identity masking' }
  ];

  return (
    <section className="py-12 bg-muted/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-border bg-card text-center shadow-sm">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono block">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-foreground block mt-1">
                {stat.label}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {stat.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
