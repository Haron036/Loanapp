import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const variantStyles = {
  default: 'bg-card',
  accent: 'bg-secondary/5 border-secondary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  accent: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default' 
}) {
  return (
    <Card className={`${variantStyles[variant]} transition-all hover:shadow-md`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-xs font-medium ${trend.positive ? 'text-success' : 'text-destructive'}`}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}