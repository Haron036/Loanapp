import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoanCard } from '@/components/LoanCard';
import { StatCard } from '@/components/StatCard';
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, 
  Wallet, 
  CreditCard, 
  Clock, 
  CheckCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { loanApi, userApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Dashboard() {
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [userLoans, setUserLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);

  // Security: Protect the route
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Fetch data from backend
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile and stats
        const profileResponse = await userApi.getProfile();
        
        // Fetch user loans
        const loansResponse = await loanApi.getAll();
        
        // Fetch loan summary
        const summaryResponse = await loanApi.getSummary();
        
        // Find active loan for repayment schedule
        const activeLoan = loansResponse.data.find(loan => 
          ['REPAYING', 'APPROVED'].includes(loan.status)
        );

        if (activeLoan) {
          // Fetch repayments for the active loan
          const repaymentsResponse = await fetch(`/api/loans/${activeLoan.id}/repayments`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const repaymentsData = await repaymentsResponse.json();
          setRepayments(repaymentsData);
        }

        setUserLoans(loansResponse.data);
        setLoanSummary(summaryResponse.data);
        
        // Calculate or fetch user stats
        if (profileResponse.data.stats) {
          setUserStats(profileResponse.data.stats);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, token]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  // Process data for display
  const totalBorrowed = loanSummary?.totalBorrowed || 0;
  const totalPaid = loanSummary?.totalRepaid || 0;
  const activeLoans = loanSummary?.totalActiveLoans || 0;
  
  // Calculate pending payments from repayments
  const pendingPayments = repayments.filter(r => r.status === 'PENDING').length;

  // Find the most relevant active loan
  const activeLoan = userLoans.find(l => ['REPAYING', 'APPROVED'].includes(l.status));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">
              {userLoans.length === 0 
                ? "You haven't applied for any loans yet."
                : `You have ${userLoans.length} total loan application${userLoans.length === 1 ? '' : 's'}.`
              }
            </p>
          </div>
          <Button variant="hero" onClick={() => navigate('/apply')} className="shadow-lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Apply for New Loan
          </Button>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Borrowed" 
            value={formatCurrency(totalBorrowed)} 
            icon={Wallet} 
            variant="accent" 
          />
          <StatCard 
            title="Total Repaid" 
            value={formatCurrency(totalPaid)} 
            icon={CheckCircle} 
            variant="success" 
          />
          <StatCard 
            title="Active Loans" 
            value={activeLoans} 
            icon={CreditCard} 
          />
          <StatCard 
            title="Pending Due" 
            value={pendingPayments} 
            icon={Clock} 
            variant={pendingPayments > 0 ? 'warning' : 'default'} 
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column: Loan Lists */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Application History</CardTitle>
                <CardDescription>Status of your recent loan requests</CardDescription>
              </CardHeader>
              <CardContent>
                {userLoans.length > 0 ? (
                  <div className="grid gap-4">
                    {userLoans.map((loan) => (
                      <LoanCard 
                        key={loan.id} 
                        loan={{
                          ...loan,
                          status: loan.status.toLowerCase()
                        }} 
                        onViewDetails={() => setSelectedLoan(loan)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground mb-4">No loan history found.</p>
                    <Button variant="outline" onClick={() => navigate('/apply')}>
                      Start your first application
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repayment Schedule Section */}
            {activeLoan && repayments.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Repayment Schedule</CardTitle>
                  <CardDescription>Upcoming installments for Loan #{activeLoan.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {repayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50">
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            payment.status === 'PAID' ? 'bg-success' : 
                            payment.status === 'OVERDUE' ? 'bg-destructive animate-pulse' : 'bg-warning'
                          }`} />
                          <div>
                            <p className="font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {formatDate(payment.dueDate)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={payment.status === 'PAID' ? 'secondary' : 'outline'} className="capitalize">
                          {payment.status.toLowerCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Credit & Actions */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-secondary/5">
                <CardTitle className="text-lg">Credit Wellness</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-6">
                <CreditScoreGauge 
                  score={user.creditScore || 720} 
                  size="lg" 
                />
                <p className="mt-4 text-xs text-center text-muted-foreground px-4">
                  {user.creditScore && user.creditScore >= 750 
                    ? "Your score is Excellent. Keep up timely repayments to maintain this!"
                    : user.creditScore && user.creditScore >= 650
                    ? "Good credit score. Continue making payments on time to improve further."
                    : "Build your credit history by maintaining timely repayments."
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start w-full" 
                  onClick={() => navigate('/apply')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> New Application
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start w-full"
                  onClick={() => navigate('/payments')}
                >
                  <CreditCard className="mr-2 h-4 w-4" /> Make a Payment
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start w-full"
                  onClick={() => navigate('/statements')}
                >
                  <Wallet className="mr-2 h-4 w-4" /> Statements
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start w-full"
                  onClick={() => navigate('/profile')}
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> View Full Profile
                </Button>
              </CardContent>
            </Card>

            {/* User Stats */}
            {userStats && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Loan Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Approval Rate</p>
                      <p className="text-2xl font-bold">
                        {userStats.totalLoanApplications > 0 
                          ? `${Math.round((userStats.approvedLoans / userStats.totalLoanApplications) * 100)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">On-time Repayment</p>
                      <p className="text-2xl font-bold">
                        {userStats.onTimeRepaymentRate > 0
                          ? `${userStats.onTimeRepaymentRate.toFixed(1)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Loan Applications</p>
                    <div className="flex justify-between text-sm">
                      <span>Approved: {userStats.approvedLoans}</span>
                      <span>Rejected: {userStats.rejectedLoans}</span>
                      <span>Total: {userStats.totalLoanApplications}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Loan Details Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
            <DialogDescription>Overview of Loan #{selectedLoan?.id}</DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Purpose</p>
                  <p className="font-medium">{selectedLoan.purpose}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Principal</p>
                  <p className="font-medium">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">APR</p>
                  <p className="font-medium">{selectedLoan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-medium">{selectedLoan.term} months</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Applied Date</p>
                  <p className="font-medium">{formatDate(selectedLoan.createdAt)}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium">Current Status</span>
                <Badge variant="hero" className="capitalize">
                  {selectedLoan.status.toLowerCase()}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  navigate(`/loans/${selectedLoan.id}`);
                  setSelectedLoan(null);
                }}
              >
                View Full Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}