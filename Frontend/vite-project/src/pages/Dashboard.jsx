import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoanCard } from '@/components/LoanCard';
import { StatCard } from '@/components/StatCard';
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Wallet, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { loanApi, userApi, formatCurrency, formatDate } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userLoans, setUserLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (!isAuthenticated) navigate('/auth'); }, [isAuthenticated, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Loans and Profile in parallel
      const [loansRes, profileRes] = await Promise.all([
        loanApi.getUserLoans(), // Changed from getAll()
        userApi.getProfile()
      ]);

      const loansList = loansRes.data.content || [];
      setUserLoans(loansList);

      // 2. Try fetching summary, but don't crash if it fails
      try {
        const summaryRes = await loanApi.getSummary();
        setLoanSummary(summaryRes.data);
      } catch (sErr) {
        console.warn("Summary endpoint not ready, using defaults");
      }

      // 3. Fetch repayments for the first active loan found
      const activeLoan = loansList.find(l => 
        ['REPAYING', 'APPROVED', 'DISBURSED', 'ACTIVE'].includes(l.status?.toUpperCase())
      );
      
      if (activeLoan) {
        try {
          const repRes = await loanApi.getRepayments(activeLoan.id);
          setRepayments(repRes.data || []);
        } catch (rErr) {
          console.warn("Repayments endpoint not ready");
        }
      }

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      setError('Failed to sync dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchDashboardData(); }, [isAuthenticated, fetchDashboardData]);

  if (loading) return <div className="p-24 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!user) return null;

  // Calculation Logic
  const totalBorrowed = loanSummary?.totalBorrowed || userLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalPaid = loanSummary?.totalRepaid || 0;
  const pendingPaymentsCount = repayments.filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user.firstName || 'User'}!</h1>
          <Button onClick={() => navigate('/apply')}><PlusCircle className="mr-2 h-4 w-4" /> New Loan</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Applied" value={formatCurrency(totalBorrowed)} icon={Wallet} />
          <StatCard title="Total Repaid" value={formatCurrency(totalPaid)} icon={CheckCircle} />
          <StatCard title="Applications" value={userLoans.length} icon={CreditCard} />
          <StatCard title="Pending Due" value={pendingPaymentsCount} icon={Clock} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>My Loan Applications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {userLoans.length > 0 ? (
                userLoans.map(loan => (
                  <LoanCard 
                    key={loan.id} 
                    loan={{...loan, status: loan.status?.toLowerCase() || 'pending'}} 
                    onViewDetails={(l) => navigate(`/loans/${l.id}`)} 
                  />
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">You haven't applied for any loans yet.</p>
                  <Button variant="link" onClick={() => navigate('/apply')}>Start your first application</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <CreditScoreGauge score={user.creditScore || 700} />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Score based on your latest financial profile.
                </p>
              </CardContent>
            </Card>

            {repayments.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Upcoming Repayments</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {repayments.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-bold text-sm">{formatCurrency(p.amount)}</p>
                        <p className="text-xs">Due: {formatDate(p.dueDate)}</p>
                      </div>
                      <Badge variant="outline">{p.status?.toLowerCase()}</Badge>
                    </div>
                  ))}
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