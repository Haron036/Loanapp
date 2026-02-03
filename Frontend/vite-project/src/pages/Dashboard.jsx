import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoanCard } from '@/components/LoanCard';
import { StatCard } from '@/components/StatCard';
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Wallet, CreditCard, Clock, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { loanApi, userApi, formatCurrency, formatDate } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [userLoans, setUserLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (!isAuthenticated) navigate('/auth'); }, [isAuthenticated, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [loansRes, summaryRes] = await Promise.all([loanApi.getAll(), loanApi.getSummary()]);
      
      const loansList = loansRes.data.content || [];
      setUserLoans(loansList);
      setLoanSummary(summaryRes.data);

      const activeLoan = loansList.find(l => ['REPAYING', 'APPROVED', 'DISBURSED', 'ACTIVE'].includes(l.status.toUpperCase()));
      if (activeLoan) {
        const repaymentsRes = await loanApi.getRepayments(activeLoan.id);
        setRepayments(repaymentsRes.data || []);
      }
    } catch (err) {
      setError('Failed to sync dashboard data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchDashboardData(); }, [isAuthenticated, fetchDashboardData]);

  if (loading) return <div className="p-24"><Skeleton className="h-64 w-full" /></div>;
  if (!user) return null;

  const totalBorrowed = loanSummary?.totalBorrowed || 0;
  const totalPaid = loanSummary?.totalRepaid || 0;
  const pendingPaymentsCount = repayments.filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {error && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user.name?.split(' ')[0]}!</h1>
          <Button onClick={() => navigate('/apply')}><PlusCircle className="mr-2 h-4 w-4" /> New Loan</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Borrowed" value={formatCurrency(totalBorrowed)} icon={Wallet} />
          <StatCard title="Total Repaid" value={formatCurrency(totalPaid)} icon={CheckCircle} />
          <StatCard title="Active Loans" value={loanSummary?.totalActiveLoans || 0} icon={CreditCard} />
          <StatCard title="Pending Due" value={pendingPaymentsCount} icon={Clock} />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
            <CardContent>
              {userLoans.length > 0 ? userLoans.map(loan => <LoanCard key={loan.id} loan={{...loan, status: loan.status.toLowerCase()}} onViewDetails={() => setSelectedLoan(loan)} />) : <p>No history found.</p>}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card><CardContent className="pt-6 flex flex-col items-center"><CreditScoreGauge score={user.creditScore || 720} /><p className="text-xs text-muted-foreground mt-2">Maintain high scores with timely payments.</p></CardContent></Card>
            {repayments.length > 0 && (
              <Card><CardHeader><CardTitle>Upcoming</CardTitle></CardHeader><CardContent className="space-y-3">
                {repayments.slice(0, 3).map(p => (
                  <div key={p.id} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                    <div><p className="font-bold text-sm">{formatCurrency(p.amount)}</p><p className="text-xs">Due: {formatDate(p.dueDate)}</p></div>
                    <Badge variant="outline">{p.status.toLowerCase()}</Badge>
                  </div>
                ))}
              </CardContent></Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}