import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LoanCard } from "@/components/LoanCard";
import { StatCard } from "@/components/StatCard";
import { CreditScoreGauge } from "@/components/CreditScoreGauge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Wallet,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loanApi, formatCurrency, formatDate } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- DATA STATES ---
  const [userLoans, setUserLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);

  // --- UI STATES ---
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const isFetching = useRef(false);

  /**
   * Status Guard Logic
   */
  const isLoanPayable = (status) => {
    const activeStatuses = ["APPROVED", "REPAYING", "DISBURSED", "ACTIVE"];
    return activeStatuses.includes(status?.toUpperCase());
  };

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (isBackground) setIsSyncing(true);
      else setLoading(true);
      setError(null);

      // Fetch base loans first
      const loansRes = await loanApi.getUserLoans();
      const loansList = loansRes.data?.content || loansRes.data || [];
      setUserLoans(loansList);

      // Attempt to fetch summary
      try {
        const summaryRes = await loanApi.getSummary();
        setLoanSummary(summaryRes.data);
      } catch (sumErr) {
        console.warn("Summary access restricted (403). Using calculated fallbacks.");
      }

      // Find the most relevant loan to show repayments for
      const activeLoan = loansList.find((l) => isLoanPayable(l.status));

      if (activeLoan) {
        try {
          const detailRes = await loanApi.getById(activeLoan.id);
          setRepayments(detailRes.data.repayments || []);
        } catch (rErr) {
          console.error("Repayment fetch failed.");
        }
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      if (err.response?.status === 403) {
        setError("Access Denied: Please check account permissions.");
      } else {
        setError("Unable to sync with server.");
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
      isFetching.current = false;
    }
  }, []);

  // --- PAYMENT HANDLER (UPDATED FOR M-PESA) ---
  const handlePayment = async (repaymentId) => {
    try {
      setProcessingPaymentId(repaymentId);

      // 1. Trigger M-Pesa STK Push
      await loanApi.payInstallment(repaymentId, { paymentMethod: "MPESA" });

      toast({
        title: "STK Push Sent",
        description: "Please enter your M-Pesa PIN on your phone to complete payment.",
      });

      // 2. Start "Fast Polling" to catch the backend callback update
      // We check every 4 seconds for 32 seconds total
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        await fetchDashboardData(true);
        
        // Check if the specific repayment is now marked as PAID
        setRepayments(prev => {
            const updated = prev.find(r => r.id === repaymentId);
            if (updated?.status?.toUpperCase() === "PAID" || attempts > 8) {
                clearInterval(pollInterval);
            }
            return prev;
        });
      }, 4000);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: err.response?.data?.message || "Could not initiate M-Pesa push.",
      });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // --- AUTH & INITIALIZATION ---
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth");
      } else {
        fetchDashboardData();
        const pollInterval = setInterval(() => fetchDashboardData(true), 30000);
        return () => clearInterval(pollInterval);
      }
    }
  }, [isAuthenticated, authLoading, navigate, fetchDashboardData]);

  // --- RENDER LOADING ---
  if (authLoading || (loading && !isSyncing))
    return (
      <div className="container mx-auto p-24 space-y-8">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );

  if (!user) return null;

  // --- CALCULATED STATS ---
  const totalBorrowed =
    loanSummary?.totalBorrowed ||
    userLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalRepaid =
    loanSummary?.totalRepaid ||
    userLoans.reduce((sum, l) => sum + (l.totalRepaid || 0), 0);
  const pendingCount = repayments.filter(
    (r) => r.status?.toUpperCase() === "PENDING"
  ).length;

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

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user.name?.split(" ")[0] || "User"}!
              </h1>
              {isSyncing && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground">
              Manage your finances and track your credit growth.
            </p>
          </div>
          <Button
            onClick={() => navigate("/apply")}
            className="shadow-lg hover:scale-105 transition-all"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> New Loan Application
          </Button>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Borrowed"
            value={formatCurrency(totalBorrowed)}
            icon={Wallet}
          />
          <StatCard
            title="Total Repaid"
            value={formatCurrency(totalRepaid)}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Active Loans"
            value={userLoans.filter((l) => isLoanPayable(l.status)).length}
            icon={CreditCard}
          />
          <StatCard
            title="Due Soon"
            value={pendingCount}
            icon={Clock}
            variant={pendingCount > 0 ? "warning" : "default"}
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* LOAN CARDS */}
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                <div>
                  <CardTitle className="text-xl">Your Loan Portfolio</CardTitle>
                </div>
                <Badge variant="secondary" className="px-3">
                  {userLoans.length} total
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {userLoans.length > 0 ? (
                  userLoans.map((loan) => (
                    <LoanCard
                      key={loan.id}
                      loan={{ ...loan, status: loan.status?.toLowerCase() }}
                      onViewDetails={(l) => setSelectedLoan(l)}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-muted/5 text-muted-foreground">
                    No active loan applications found.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* REPAYMENT SCHEDULE */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Repayments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {repayments.length > 0 ? (
                  repayments.slice(0, 5).map((p) => {
                    const parentLoan = userLoans.find((l) => l.id === p.loanId) || userLoans[0];
                    const activeForPayment = isLoanPayable(parentLoan?.status);

                    return (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              p.status?.toUpperCase() === "PAID"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }`}
                          />
                          <div className="space-y-1">
                            <p className="font-bold text-sm">
                              {formatCurrency(p.amount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Due: {formatDate(p.dueDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase bg-white ${
                                p.status?.toUpperCase() === 'PAID' ? 'text-green-600 border-green-200' : ''
                            }`}
                          >
                            {p.status}
                          </Badge>

                          {p.status?.toUpperCase() === "PENDING" && activeForPayment && (
                            <Button
                              size="sm"
                              className="h-8 text-[10px]"
                              disabled={processingPaymentId === p.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePayment(p.id);
                              }}
                            >
                              {processingPaymentId === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Pay via M-Pesa"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-muted-foreground italic border rounded-xl border-dashed">
                    No pending repayments found for active loans.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle>Credit Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-8">
                <CreditScoreGauge score={user.creditScore || 650} size="lg" />
                <p className="text-xs text-center text-muted-foreground mt-6 px-4">
                  Maintaining consistent payments increases your loan limit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/apply")}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Apply for New Loan
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => fetchDashboardData(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Sync Account Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loan Overview</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="font-bold">
                  {formatCurrency(selectedLoan.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Term</p>
                <p className="font-bold">{selectedLoan.term} months</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className="uppercase">{selectedLoan.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest</p>
                <p className="font-bold text-green-600">
                  {selectedLoan.interestRate}%
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}