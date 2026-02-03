import React from 'react';
import { getCreditScoreCategory } from '../lib/api.js';

export function CreditScoreGauge({ score, size = 'md' }) {
  const { label, color } = getCreditScoreCategory(score);
  
  // Calculate the percentage for the gauge (300-850 range)
  const percentage = ((score - 300) / 550) * 100;
  const circumference = 2 * Math.PI * 45;
  
  // 270 degrees (0.75 of circle)
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75; 

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-[135deg]" viewBox="0 0 100 100">
        {/* Background arc */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-muted"
          strokeDasharray={circumference * 0.75}
          strokeDashoffset={0}
        />
        {/* Score arc */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-secondary transition-all duration-1000 ease-out"
          strokeDasharray={circumference * 0.75}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      {/* Score display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${textSizes[size]} ${color}`}>{score}</span>
        <span className={`${labelSizes[size]} text-muted-foreground`}>{label}</span>
      </div>
    </div>
  );
}