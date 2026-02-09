import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const variantStyles = {
  default: 'bg-white border-slate-200',
  accent: 'bg-blue-50/30 border-blue-100',
  success: 'bg-emerald-50/30 border-emerald-100',
  warning: 'bg-amber-50/30 border-amber-100',
  destructive: 'bg-red-50/30 border-red-100',
};

const iconStyles = {
  default: 'bg-slate-100 text-slate-600',
  accent: 'bg-blue-100 text-blue-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  destructive: 'bg-red-100 text-red-600',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  loading = false 
}) {
  return (
    <Card className={`${variantStyles[variant]} transition-all duration-200 hover:shadow-sm border shadow-none`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
            
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            )}

            <div className="flex flex-col gap-1">
              {subtitle && !loading && (
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
              )}
              
              {trend && !loading && (
                <div className={`flex items-center text-xs font-bold ${
                  trend.positive ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  <span className="mr-1">{trend.positive ? '▲' : '▼'}</span>
                  {Math.abs(trend.value)}%
                  <span className="ml-1 font-medium text-slate-400">vs last month</span>
                </div>
              )}
            </div>
          </div>

          <div className={`p-2.5 rounded-xl ${iconStyles[variant]} shadow-sm`}>
            {Icon && <Icon className="h-5 w-5" strokeWidth={2.5} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
