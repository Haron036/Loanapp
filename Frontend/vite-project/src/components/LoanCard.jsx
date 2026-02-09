import React from 'react';
import { formatCurrency, formatDate } from '../lib/api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight, Calendar, Banknote, Clock, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  disbursed: 'bg-blue-100 text-blue-700 border-blue-200',
  repaying: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function LoanCard({ loan, onViewDetails }) {
  // Defensive check for status to prevent crashes
  const currentStatus = loan.status?.toLowerCase() || 'pending';
  const statusClass = statusColors[currentStatus] || statusColors.pending;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 bg-card overflow-hidden">
      {/* Visual top accent based on status */}
      <div className={`h-1 w-full ${statusClass.split(' ')[0]}`} />
      
      <CardHeader className="pb-3 bg-gradient-to-r from-transparent to-muted/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Ref: {loan.id}</p>
            <h3 className="font-bold text-lg text-foreground leading-tight">{loan.purpose || 'General Loan'}</h3>
          </div>
          <Badge variant="outline" className={`capitalize px-3 py-1 font-semibold shadow-sm ${statusClass}`}>
            {currentStatus}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Amount Section - Using Banknote icon for KSh */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="p-2 rounded-full bg-white shadow-sm">
              <Banknote className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Principal</p>
              <p className="font-bold text-sm tracking-tight">{formatCurrency(loan.amount)}</p>
            </div>
          </div>

          {/* Term Section */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="p-2 rounded-full bg-white shadow-sm">
              <Clock className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
              <p className="font-bold text-sm tracking-tight">{loan.termMonths || loan.term || '--'} Mos</p>
            </div>
          </div>
        </div>
        
        {/* Dates & Quick Info */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Applied: {formatDate(loan.appliedDate || loan.appliedAt)}</span>
          </div>
          {loan.interestRate && (
            <div className="text-[11px] font-bold text-emerald-600">
              {loan.interestRate}% APR
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-dashed">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Monthly Installment</p>
            <p className="font-black text-xl text-primary flex items-baseline gap-1">
               {formatCurrency(loan.monthlyPayment)}
            </p>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-xl px-5 shadow-lg bg-primary hover:bg-primary/90 transition-all active:scale-95"
            onClick={() => onViewDetails?.(loan)}
          >
            Manage
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}