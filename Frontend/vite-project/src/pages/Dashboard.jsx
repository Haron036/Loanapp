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

  // --- Flexible Payment States ---
  const [flexiblePaymentAmount, setFlexiblePaymentAmount] = useState("");
  const [activeFlexibleLoan, setActiveFlexibleLoan] = useState(null);

  const isFetching = useRef(false);

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

      const loansRes = await loanApi.getUserLoans();
      const loansList = loansRes.data?.content || loansRes.data || [];
      setUserLoans(loansList);

      try {
        const summaryRes = await loanApi.getSummary();
        setLoanSummary(summaryRes.data);
      } catch (sumErr) {
        console.warn("Summary calculation falling back to local reduce.");
      }

      const payableLoans = loansList.filter((l) => isLoanPayable(l.status));
      if (payableLoans.length > 0) {
        const repaymentPromises = payableLoans.map((loan) => loanApi.getById(loan.id));
        const results = await Promise.all(repaymentPromises);
        const allRepayments = results
          .flatMap((res) => res.data.repayments || [])
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setRepayments(allRepayments);
      } else {
        setRepayments([]);
      }
    } catch (err) {
      setError("Unable to sync with server.");
    } finally {
      setLoading(false);
      setIsSyncing(false);
      isFetching.current = false;
    }
  }, []);

  // --- POLLING LOGIC ---
  const startPolling = () => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      await fetchDashboardData(true);
      if (attempts >= 10) clearInterval(interval);
    }, 4000);
  };

  // --- PAYMENT HANDLERS ---
  const handlePayment = async (repaymentId) => {
    try {
      setProcessingPaymentId(repaymentId);
      await loanApi.payInstallment(repaymentId, { paymentMethod: "MPESA" });
      toast({ title: "STK Push Sent", description: "Please complete the payment on your phone." });
      startPolling();
    } catch (err) {
      toast({ variant: "destructive", title: "Payment Failed", description: "Could not initiate push." });
    } finally { setProcessingPaymentId(null); }
  };

  const handleFlexiblePayment = async () => {
    if (!flexiblePaymentAmount || flexiblePaymentAmount <= 0) return;
    try {
      setProcessingPaymentId(activeFlexibleLoan.id);
      await loanApi.flexibleRepay(activeFlexibleLoan.id, { amount: flexiblePaymentAmount, paymentMethod: "MPESA" });
      toast({ title: "STK Push Sent", description: "Your balance will update once confirmed." });
      setFlexiblePaymentAmount("");
      setActiveFlexibleLoan(null);
      startPolling();
    } catch (err) {
      toast({ variant: "destructive", title: "Payment Failed", description: "Could not initiate push." });
    } finally { setProcessingPaymentId(null); }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) navigate("/auth");
      else {
        fetchDashboardData();
        const poll = setInterval(() => fetchDashboardData(true), 30000);
        return () => clearInterval(poll);
      }
    }
  }, [isAuthenticated, authLoading, navigate, fetchDashboardData]);

  if (authLoading || (loading && !isSyncing)) return <div className="container mx-auto p-24 space-y-8"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 w-full" /></div>;
  if (!user) return null;

  // --- CALCULATED STATS ---
  const totalBorrowed = loanSummary?.totalBorrowed || userLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalRepaid = loanSummary?.totalRepaid || userLoans.reduce((sum, l) => sum + (l.totalRepaid || 0), 0);
  const pendingCount = repayments.filter((r) => r.status?.toUpperCase() === "PENDING").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {error && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Welcome back, {user.name?.split(" ")[0]}!</h1>
              {isSyncing && <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />}
            </div>
            <p className="text-muted-foreground">Manage your finances and track your credit growth.</p>
          </div>
          <Button onClick={() => navigate("/apply")} className="shadow-lg hover:scale-105 transition-all bg-emerald-700 hover:bg-emerald-800">
            <PlusCircle className="mr-2 h-4 w-4" /> New Loan Application
          </Button>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Borrowed" value={formatCurrency(totalBorrowed)} icon={Wallet} />
          <StatCard title="Total Repaid" value={formatCurrency(totalRepaid)} icon={CheckCircle} variant="success" className="border-emerald-200" />
          <StatCard title="Active Loans" value={userLoans.filter(l => isLoanPayable(l.status)).length} icon={CreditCard} />
          <StatCard title="Due Soon" value={pendingCount} icon={Clock} variant={pendingCount > 0 ? "warning" : "default"} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* LOAN CARDS WITH PROGRESS BARS */}
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                <CardTitle className="text-xl text-emerald-900">Your Loan Portfolio</CardTitle>
                <Badge variant="secondary" className="px-3 bg-emerald-50 text-emerald-700 border-emerald-100">{userLoans.length} total</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {userLoans.length > 0 ? userLoans.map((loan) => {
                  const totalWithInterest = loan.amount + (loan.amount * (loan.interestRate / 100));
                  const progress = Math.min(Math.round(((loan.totalRepaid || 0) / totalWithInterest) * 100), 100);
                  
                  return (
                    <div key={loan.id} className="p-5 border rounded-3xl bg-white shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loan ID: {loan.id.slice(0,8)}</p>
                          <h3 className="text-xl font-bold text-emerald-950">{formatCurrency(loan.amount)}</h3>
                        </div>
                        <Badge className={`uppercase ${loan.status?.toUpperCase() === 'REPAYING' ? 'bg-emerald-600' : 'bg-slate-500'}`}>{loan.status}</Badge>
                      </div>

                      {/* PROGRESS TRACKER */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-emerald-800">Repayment Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-600 transition-all duration-1000 ease-in-out" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Paid: {formatCurrency(loan.totalRepaid || 0)}</span>
                          <span>Target: {formatCurrency(totalWithInterest)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => setSelectedLoan(loan)}>Details</Button>
                        {isLoanPayable(loan.status) && (
                          <Button size="sm" className="flex-1 bg-emerald-700 hover:bg-emerald-800" onClick={() => setActiveFlexibleLoan(loan)}>Pay Custom Amount</Button>
                        )}
                      </div>
                    </div>
                  );
                }) : <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-muted/5">No active loans found.</div>}
              </CardContent>
            </Card>

            {/* REPAYMENT SCHEDULE */}
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-lg text-emerald-900">Upcoming Repayments</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {repayments.length > 0 ? repayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${p.status?.toUpperCase() === "PAID" ? "bg-emerald-500" : "bg-yellow-500"}`} />
                      <div>
                        <p className="font-bold text-sm">{formatCurrency(p.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">Due: {formatDate(p.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] uppercase bg-white ${p.status?.toUpperCase() === 'PAID' ? 'text-emerald-600 border-emerald-200' : ''}`}>{p.status}</Badge>
                      {p.status?.toUpperCase() === "PENDING" && isLoanPayable(userLoans.find(l => l.id === p.loanId)?.status) && (
                        <Button size="sm" className="h-8 text-[10px] bg-emerald-700" disabled={processingPaymentId === p.id} onClick={() => handlePayment(p.id)}>
                          {processingPaymentId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pay via M-Pesa"}
                        </Button>
                      )}
                    </div>
                  </div>
                )) : <div className="text-center py-10 text-muted-foreground italic border rounded-xl border-dashed">No pending repayments.</div>}
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-emerald-900">Credit Score</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center pb-8">
                <CreditScoreGauge score={user.creditScore || 650} size="lg" />
                <p className="text-xs text-center text-muted-foreground mt-6 px-4 italic">Healthy repayment habits lead to higher limits.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-emerald-900">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start border-emerald-100 text-emerald-700 hover:bg-emerald-50" onClick={() => navigate("/apply")}><PlusCircle className="mr-2 h-4 w-4" /> Apply for New Loan</Button>
                <Button variant="outline" className="w-full justify-start border-emerald-100 text-emerald-700 hover:bg-emerald-50" onClick={() => fetchDashboardData(true)}><RefreshCw className="mr-2 h-4 w-4" /> Sync Account Data</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="text-emerald-900 text-xl font-bold">Loan Overview</DialogTitle></DialogHeader>
          {selectedLoan && (
            <div className="grid grid-cols-2 gap-4 mt-4 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
              <div><p className="text-xs text-emerald-600 font-semibold uppercase">Principal</p><p className="font-bold text-lg">{formatCurrency(selectedLoan.amount)}</p></div>
              <div><p className="text-xs text-emerald-600 font-semibold uppercase">Repaid</p><p className="font-bold text-lg text-emerald-700">{formatCurrency(selectedLoan.totalRepaid || 0)}</p></div>
              <div><p className="text-xs text-emerald-600 font-semibold uppercase">Status</p><Badge className="bg-emerald-600">{selectedLoan.status}</Badge></div>
              <div><p className="text-xs text-emerald-600 font-semibold uppercase">Interest</p><p className="font-bold text-lg">{selectedLoan.interestRate}%</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FLEXIBLE PAYMENT DIALOG */}
      <Dialog open={!!activeFlexibleLoan} onOpenChange={() => setActiveFlexibleLoan(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="text-emerald-900 text-xl font-bold">Make a Payment</DialogTitle></DialogHeader>
          {activeFlexibleLoan && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">Enter custom amount to pay towards loan ending in ...{activeFlexibleLoan.id.slice(-4)}</p>
              <div className="relative">
                <span className="absolute left-4 top-2.5 font-bold text-emerald-700">KSh</span>
                <input type="number" className="w-full border-2 border-emerald-100 rounded-2xl px-12 py-3 focus:border-emerald-500 outline-none text-lg font-bold" placeholder="0" value={flexiblePaymentAmount} onChange={(e) => setFlexiblePaymentAmount(e.target.value)} />
              </div>
              <Button className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-lg rounded-2xl" onClick={handleFlexiblePayment} disabled={processingPaymentId === activeFlexibleLoan.id}>
                {processingPaymentId === activeFlexibleLoan.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initiate M-Pesa Payment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}