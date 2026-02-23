import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatCard } from "@/components/StatCard";
import { CreditScoreGauge } from "@/components/CreditScoreGauge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

  // ---------------- STATE ----------------
  const [userLoans, setUserLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [error, setError] = useState(null);

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeFlexibleLoan, setActiveFlexibleLoan] = useState(null);
  const [flexiblePaymentAmount, setFlexiblePaymentAmount] = useState("");

  const isFetching = useRef(false);

  // ---------------- HELPERS ----------------
  const isLoanPayable = (status) =>
    ["APPROVED", "REPAYING", "DISBURSED", "ACTIVE"].includes(
      status?.toUpperCase()
    );

  const calculateLoanMetrics = (loan) => {
    const totalWithInterest =
      loan.amount + loan.amount * (loan.interestRate / 100);

    const totalRepaid = loan.totalRepaid || 0;
    const remaining = Math.max(totalWithInterest - totalRepaid, 0);

    const progress =
      totalWithInterest > 0
        ? Math.min(Math.round((totalRepaid / totalWithInterest) * 100), 100)
        : 0;

    return { totalWithInterest, totalRepaid, remaining, progress };
  };

  // ---------------- FETCH ----------------
  const fetchDashboardData = useCallback(async (background = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      background ? setIsSyncing(true) : setLoading(true);
      setError(null);

      const loansRes = await loanApi.getUserLoans();
      const loans = loansRes.data?.content || loansRes.data || [];
      setUserLoans(loans);

      try {
        const summaryRes = await loanApi.getSummary();
        setLoanSummary(summaryRes.data);
      } catch {
        console.warn("Summary unavailable, using local calculation.");
      }

      const payableLoans = loans.filter((l) => isLoanPayable(l.status));

      if (payableLoans.length > 0) {
        const details = await Promise.all(
          payableLoans.map((loan) => loanApi.getById(loan.id))
        );

        const allRepayments = details
          .flatMap((res) => res.data.repayments || [])
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() -
              new Date(b.dueDate).getTime()
          );

        setRepayments(allRepayments);
      } else {
        setRepayments([]);
      }
    } catch {
      setError("Unable to sync with server.");
    } finally {
      setLoading(false);
      setIsSyncing(false);
      isFetching.current = false;
    }
  }, []);

  // ---------------- POLLING ----------------
  const startPolling = () => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      await fetchDashboardData(true);
      if (attempts >= 10) clearInterval(interval);
    }, 4000);
  };

  // ---------------- PAYMENTS ----------------
  const handlePayment = async (repaymentId) => {
    try {
      setProcessingPaymentId(repaymentId);

      await loanApi.payInstallment(repaymentId, {
        paymentMethod: "MPESA",
      });

      toast({
        title: "STK Push Sent",
        description: "Complete payment on your phone.",
      });

      startPolling();
    } catch {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Could not initiate push.",
      });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleFlexiblePayment = async () => {
    if (!flexiblePaymentAmount || flexiblePaymentAmount <= 0) return;

    try {
      setProcessingPaymentId(activeFlexibleLoan.id);

      await loanApi.flexibleRepay(activeFlexibleLoan.id, {
        amount: flexiblePaymentAmount,
        paymentMethod: "MPESA",
      });

      toast({
        title: "STK Push Sent",
        description: "Balance updates after confirmation.",
      });

      setFlexiblePaymentAmount("");
      setActiveFlexibleLoan(null);
      startPolling();
    } catch {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Could not initiate push.",
      });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) navigate("/auth");
      else {
        fetchDashboardData();
        const interval = setInterval(
          () => fetchDashboardData(true),
          30000
        );
        return () => clearInterval(interval);
      }
    }
  }, [authLoading, isAuthenticated, navigate, fetchDashboardData]);

  if (authLoading || (loading && !isSyncing)) {
    return (
      <div className="container mx-auto p-24 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) return null;

  // ---------------- STATS ----------------
  const totalBorrowed =
    loanSummary?.totalBorrowed ||
    userLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

  const totalRepaid =
    loanSummary?.totalRepaid ||
    userLoans.reduce((sum, l) => sum + (l.totalRepaid || 0), 0);

  const pendingCount = repayments.filter(
    (r) => r.status?.toUpperCase() === "PENDING"
  ).length;

  // ---------------- UI ----------------
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

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">
              Welcome back, {user.name?.split(" ")[0]}!
            </h1>
            {isSyncing && (
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
            )}
          </div>

          <Button
            onClick={() => navigate("/apply")}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Loan
          </Button>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Borrowed" value={formatCurrency(totalBorrowed)} icon={Wallet} />
          <StatCard title="Total Repaid" value={formatCurrency(totalRepaid)} icon={CheckCircle} variant="success" />
          <StatCard title="Active Loans" value={userLoans.filter(l => isLoanPayable(l.status)).length} icon={CreditCard} />
          <StatCard title="Due Soon" value={pendingCount} icon={Clock} variant={pendingCount > 0 ? "warning" : "default"} />
        </div>

        {/* LOANS */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Your Loan Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {userLoans.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No active loans found.
              </div>
            )}

            {userLoans.map((loan) => {
              const { totalWithInterest, totalRepaid, remaining, progress } =
                calculateLoanMetrics(loan);

              return (
                <div key={loan.id} className="p-5 border rounded-3xl bg-white shadow-sm">

                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">
                        Loan ID: {loan.id.slice(0, 8)}
                      </p>
                      <h3 className="text-xl font-bold">
                        {formatCurrency(loan.amount)}
                      </h3>
                    </div>
                    <Badge className="uppercase">
                      {loan.status}
                    </Badge>
                  </div>

                  {/* PROGRESS */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Repayment Progress</span>
                      <span>{progress}%</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Paid: {formatCurrency(totalRepaid)}</span>
                      <span>Remaining: {formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {isLoanPayable(loan.status) && (
                    <Button
                      size="sm"
                      className="w-full bg-emerald-700"
                      onClick={() => setActiveFlexibleLoan(loan)}
                    >
                      Pay Custom Amount
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}