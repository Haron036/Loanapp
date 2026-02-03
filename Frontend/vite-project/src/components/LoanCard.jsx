import React from 'react';
import { formatCurrency, formatDate } from '../lib/api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight, Calendar, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusColors = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  disbursed: 'bg-secondary/10 text-secondary border-secondary/20',
  repaying: 'bg-secondary/10 text-secondary border-secondary/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export function LoanCard({ loan, onViewDetails }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Loan #{loan.id}</p>
            <h3 className="font-semibold text-lg">{loan.purpose}</h3>
          </div>
          <Badge variant="outline" className={statusColors[loan.status]}>
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">{formatCurrency(loan.amount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Term</p>
              <p className="font-semibold">{loan.term} months</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Applied: {formatDate(loan.appliedAt)}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payment</p>
            <p className="font-semibold text-secondary">{formatCurrency(loan.monthlyPayment)}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors"
            onClick={() => onViewDetails?.(loan)}
          >
            Details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}