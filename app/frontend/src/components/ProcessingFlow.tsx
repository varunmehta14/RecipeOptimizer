import React from 'react';
import { cn } from '@/lib/utils';

// Flow step types
export type FlowStep = {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  usesDatabase?: boolean;
  duration?: number; // in ms
};

// Example flow steps based on the pipeline
export const defaultPipelineSteps: FlowStep[] = [
  {
    id: 'parse',
    name: 'Recipe Parsing',
    description: 'Converting raw text into structured recipe data',
    status: 'pending',
    usesDatabase: true,
  },
  {
    id: 'router',
    name: 'Diet Classification',
    description: 'Determining the appropriate diet category',
    status: 'pending',
    usesDatabase: true,
  },
  {
    id: 'enrichers',
    name: 'Recipe Enrichment',
    description: 'Analyzing nutrition, allergens, and flavor profiles',
    status: 'pending',
    usesDatabase: true,
  },
  {
    id: 'orchestrator',
    name: 'Recipe Optimization',
    description: 'Creating the optimized recipe based on your goal',
    status: 'pending',
    usesDatabase: true,
  },
  {
    id: 'evaluator',
    name: 'Quality Evaluation',
    description: 'Refining the recipe to ensure it meets standards',
    status: 'pending',
    usesDatabase: true,
  },
  {
    id: 'storage',
    name: 'Recipe Storage',
    description: 'Saving to database for future reference',
    status: 'pending',
    usesDatabase: true,
  },
];

interface ProcessingFlowProps {
  steps: FlowStep[];
  className?: string;
  showTimings?: boolean;
}

export function ProcessingFlow({ steps, className, showTimings = false }: ProcessingFlowProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold mb-2">AI Processing Pipeline</h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "relative border rounded-lg p-4 transition-all duration-300",
              step.status === 'pending' && "border-slate-200 bg-slate-50",
              step.status === 'active' && "border-blue-300 bg-blue-50 shadow-md",
              step.status === 'complete' && "border-green-200 bg-green-50",
              step.status === 'error' && "border-red-200 bg-red-50"
            )}
          >
            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className="absolute left-1/2 -bottom-3 w-0.5 h-3 bg-slate-300 z-0"></div>
            )}
            
            {/* Status indicator */}
            <div className="flex items-center mb-1">
              <div 
                className={cn(
                  "w-2.5 h-2.5 rounded-full mr-2",
                  step.status === 'pending' && "bg-slate-300",
                  step.status === 'active' && "bg-blue-500 animate-pulse",
                  step.status === 'complete' && "bg-green-500",
                  step.status === 'error' && "bg-red-500"
                )}
              />
              <h4 className={cn(
                "font-medium",
                step.status === 'active' && "text-blue-800",
                step.status === 'complete' && "text-green-800",
                step.status === 'error' && "text-red-800"
              )}>
                {step.name}
              </h4>
              
              {/* Processing time */}
              {showTimings && step.duration && step.status === 'complete' && (
                <span className="ml-auto text-xs text-slate-500">
                  {(step.duration / 1000).toFixed(2)}s
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-600">{step.description}</p>
            
            {/* Database indicator */}
            {step.usesDatabase && (
              <div className="flex items-center mt-2 text-xs text-slate-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  className="w-3.5 h-3.5 mr-1 text-indigo-500"
                >
                  <path d="M10 2a8.75 8.75 0 00-7 14.2 7.25 7.25 0 010-2.4A6.25 6.25 0 0110 4.5a6.25 6.25 0 017 7.75 7.25 7.25 0 012.4 0A8.75 8.75 0 0010 2z" />
                  <path d="M14.596 15.657A1.344 1.344 0 0015.5 14.5a1.5 1.5 0 00-1.5-1.5 1.344 1.344 0 00-1.157.904 7.25 7.25 0 01-2.093 3.306 6.25 6.25 0 01-8.86-8.858 7.25 7.25 0 013.306-2.094A1.344 1.344 0 005.5 5.5 1.5 1.5 0 004 4a1.344 1.344 0 00-1.153.904A8.75 8.75 0 0010 19a8.75 8.75 0 004.596-3.343z" />
                </svg>
                <span>{step.status !== 'pending' ? 'Database interaction' : 'Will use database'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Animation component for active processing
export function ActiveProcessingFlow() {
  const [steps, setSteps] = React.useState<FlowStep[]>(defaultPipelineSteps.map((step, index) => ({
    ...step,
    status: index === 0 ? 'active' : 'pending'
  })));

  React.useEffect(() => {
    // Simulate the pipeline execution with delays
    const timers: NodeJS.Timeout[] = [];
    
    // First step already active on mount
    
    // Move through the remaining steps
    for (let i = 0; i < steps.length; i++) {
      const delay = 2000 + (i * 3000); // Increasing delays for each step
      
      // Complete the current step and activate the next one
      const timer = setTimeout(() => {
        setSteps(prev => {
          const newSteps = [...prev];
          
          if (i < prev.length) {
            // Complete current step
            newSteps[i] = { ...newSteps[i], status: 'complete', duration: 2000 + (i * 500) };
            
            // Activate next step if exists
            if (i + 1 < prev.length) {
              newSteps[i + 1] = { ...newSteps[i + 1], status: 'active' };
            }
          }
          
          return newSteps;
        });
      }, delay);
      
      timers.push(timer);
    }
    
    return () => {
      // Clean up all timers on unmount
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return <ProcessingFlow steps={steps} showTimings={true} />;
} 