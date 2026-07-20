import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
}

export interface TimelineProps {
  steps: TimelineStep[];
  currentStepId: string;
}

export function Timeline({ steps, currentStepId }: TimelineProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="w-full px-2 py-6 overflow-x-auto relative">
      <div className="min-w-[600px] flex items-center justify-between relative">
        {/* Background Progress Line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -z-10 -translate-y-1/2 rounded"></div>
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-0 top-1/2 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500 rounded"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
        ></div>

        {steps.map((step, idx) => {
          const isCompleted = currentIndex > -1 && idx < currentIndex;
          const isCurrent = currentIndex > -1 && idx === currentIndex;
          const isPending = currentIndex === -1 || idx > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center group relative z-10 w-16 group bg-card">
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-20">
                {step.label}
              </div>

              {/* Circle Indicator */}
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mb-2 transition-colors duration-300 bg-card ${
                  isCompleted 
                    ? 'bg-primary border-primary' 
                    : isCurrent 
                      ? 'border-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                      : 'border-muted-foreground'
                }`}
              >
                {isCompleted && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                {isCurrent && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </div>
              
              {/* Label */}
              <span 
                className={`text-xs font-medium text-center leading-tight ${
                  isCurrent 
                    ? 'text-foreground font-semibold' 
                    : isCompleted 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
