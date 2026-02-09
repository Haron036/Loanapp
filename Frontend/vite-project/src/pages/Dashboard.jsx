import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoanCard } from '@/components/LoanCard';
import { StatCard } from '@/components/StatCard';
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Wallet, CreditCard, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { loanApi, userApi, adminApi, formatCurrency, formatDate } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [userLoans, setUserLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const isFetching = useRef(false);

  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (isBackground) setIsSyncing(true); else setLoading(true);
      setError(null);

      // 1. Parallel fetch for core data
      const [loansRes, profileRes, summaryRes] = await Promise.allSettled([
        loanApi.getUserLoans(),
        userApi.getProfile(),
        loanApi.getSummary() // Using the user-specific summary
      ]);

      // 2. Process Loan List
      if (loansRes.status === 'fulfilled') {
        const loansList = loansRes.value.data?.content || loansRes.value.data || [];
        setUserLoans(loansList);

        // Fetch repayments for the most relevant active loan
        const activeLoan = loansList.find(l =>
          ['REPAYING', 'APPROVED', 'DISBURSED', 'ACTIVE'].includes(l.status?.toUpperCase())
        );

        if (activeLoan) {
          try {
            const detailRes = await loanApi.getById(activeLoan.id);
            setRepayments(detailRes.data.repayments || []);
          } catch (rErr) {
            console.warn("Repayment fetch failed for loan:", activeLoan.id);
          }
        }
      }

      // 3. Process Summary Data
      if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
        setLoanSummary(summaryRes.value.data);
      }

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      setError('Connection interrupted. Retrying...');
    } finally {
      setLoading(false);
      setIsSyncing(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    fetchDashboardData();

    // Real-time polling every 20 seconds
    const pollInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, navigate, fetchDashboardData]);

  if (loading) return (
    <div className="container mx-auto p-24 space-y-8">
      <div className="flex justify-between"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-32" /></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      <Skeleton className="h-96 w-full" />
    </div>
  );

  if (!user) return null;

  // Manual fallback calculations if summary API is unavailable
  const totalBorrowed = loanSummary?.totalBorrowed || userLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalRepaid = loanSummary?.totalRepaid || userLoans.reduce((sum, l) => sum + (l.totalRepaid || 0), 0);
  const pendingPaymentsCount = repayments.filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {error && (
          <Alert variant="destructive" className="mb-6 animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user.firstName || user.name?.split(' ')[0] || 'User'}!
            </h1>
            {isSyncing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button onClick={() => navigate('/apply')} className="shadow-lg hover:scale-105 transition-transform">
            <PlusCircle className="mr-2 h-4 w-4" /> New Loan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Applied" value={formatCurrency(totalBorrowed)} icon={Wallet} />
          <StatCard title="Total Repaid" value={formatCurrency(totalRepaid)} icon={CheckCircle} variant="success" />
          <StatCard title="Active Loans" value={userLoans.filter(l => l.status === 'APPROVED' || l.status === 'REPAYING').length} icon={CreditCard} />
          <StatCard title="Installments Due" value={pendingPaymentsCount} icon={Clock} variant="warning" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b mb-4">
              <CardTitle className="text-xl">Loan History</CardTitle>
              <Badge variant="secondary" className="px-3">{userLoans.length} Applications</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {userLoans.length > 0 ? (
                userLoans.map(loan => (
                  <LoanCard 
                    key={loan.id} 
                    loan={{
                      ...loan, 
                      status: loan.status?.toLowerCase(),
                      // Ensure date mapping matches backend DTO
                      appliedDate: loan.appliedDate || loan.createdAt
                    }} 
                    onViewDetails={(l) => navigate(`/loans/${l.id}`)} 
                  />
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium">No loans found on this account.</p>
                  <Button variant="link" onClick={() => navigate('/apply')} className="mt-2">
                    Create your first application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardContent className="pt-8 flex flex-col items-center bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                <CreditScoreGauge score={user.creditScore || 650} />
                <div className="text-center mt-6">
                  <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Credit Health</p>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">
                    Updated real-time based on payment history
                  </p>
                </div>
              </CardContent>
            </Card>

            {repayments.length > 0 && (
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Upcoming Repayments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {repayments.filter(r => r.status === 'PENDING').slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:bg-slate-100">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{formatCurrency(p.amount)}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> Due: {formatDate(p.dueDate)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white">
                        {p.status?.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-xs text-primary" onClick={() => navigate('/loans')}>
                    View All Installments
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}