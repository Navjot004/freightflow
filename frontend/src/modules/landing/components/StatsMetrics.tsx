import React from 'react';
import { motion } from 'framer-motion';

export const StatsMetrics: React.FC = () => {
  const stats = [
    { label: 'On-Time Delivery Rate', value: '99.98%', desc: 'Real-time GPS telematics routing' },
    { label: 'Freight Rate Value Managed', value: '$45M+', desc: 'Multi-tier financial rate engine' },
    { label: 'GPS Broadcast Latency', value: '< 3.2s', desc: 'WebSocket live position streams' },
    { label: 'Disintermediation Privacy', value: '100%', desc: '1-Hop corporate identity masking' }
  ];

  return (
    <section className="py-16 relative bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-center relative group hover:border-slate-700 transition-all"
            >
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 font-mono block">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-white block mt-2">
                {stat.label}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {stat.desc}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
