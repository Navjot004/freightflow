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
    <div className="w-full px-4 pt-12 pb-6 overflow-x-auto relative">
      <div className="min-w-[650px] flex items-center justify-between relative">
        {/* Background Progress Line */}
        <div className="absolute left-0 top-[15px] w-full h-1 bg-border -z-10 rounded"></div>
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-0 top-[15px] h-1 bg-primary -z-10 transition-all duration-500 rounded shadow-sm"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
        ></div>

        {steps.map((step, idx) => {
          const isCompleted = currentIndex > -1 && idx < currentIndex;
          const isCurrent = currentIndex > -1 && idx === currentIndex;
          return (
            <div key={step.id} className="flex flex-col items-center group relative z-10 w-16 bg-transparent">
              
              {/* Sleek Tooltip badge (positioned with ample top clearance so it never clips) */}
              <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-y-1 group-hover:translate-y-0 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap z-30 flex items-center gap-1">
                {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                {isCompleted && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                <span>{step.label}</span>
              </div>

              {/* Circle Indicator */}
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300 bg-card cursor-pointer group-hover:scale-110 ${
                  isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                    : isCurrent 
                      ? 'border-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-primary/20' 
                      : 'border-muted-foreground/40 hover:border-foreground'
                }`}
              >
                {isCompleted && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
              </div>
              
              {/* Step Label below */}
              <span 
                className={`text-[11px] font-medium text-center leading-tight transition-colors ${
                  isCurrent 
                    ? 'text-primary font-bold' 
                    : isCompleted 
                      ? 'text-foreground font-medium' 
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
