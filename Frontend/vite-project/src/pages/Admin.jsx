import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminApi, loanApi, formatCurrency, formatDate, getCreditScoreCategory } from '@/lib/api';
import { 
  Users, DollarSign, TrendingUp, Clock, Eye, RefreshCw, 
  CheckCircle, XCircle 
} from 'lucide-react';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  DISBURSED: 'bg-blue-100 text-blue-700 border-blue-200',
  REPAYING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loans, setLoans] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [overview, setOverview] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. Real-Time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Data Fetching Logic
  const fetchAdminData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [loansRes, dashboardRes, overviewRes] = await Promise.all([
        adminApi.getAllLoans(0, 50),
        adminApi.getDashboardAnalytics(),
        adminApi.getOverviewAnalytics(),
      ]);

      setLoans(loansRes.data.content || []);
      setDashboard(dashboardRes.data || {});
      setOverview(overviewRes.data || {});
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return navigate('/auth');
    if (user && !user.role?.toUpperCase().includes('ADMIN')) return navigate('/dashboard');

    fetchAdminData();
    const interval = setInterval(() => fetchAdminData(true), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, navigate, fetchAdminData]);

  // 3. Status Update Logic (Automatic change)
const handleUpdateStatus = async (loanId, newStatus) => {
  try {
    setRefreshing(true);
    
    if (newStatus === 'APPROVED') {
      // Logic: backend uses body.getOrDefault("notes", ...)
      await loanApi.approve(loanId, { notes: "Verified and approved via Admin Dashboard" });
    } else if (newStatus === 'REJECTED') {
      // Logic: backend uses body.getOrDefault("reason", ...)
      await loanApi.reject(loanId, { reason: "Does not meet credit requirements" });
    }

    // --- AUTOMATIC STATUS CHANGE (Optimistic UI) ---
    setLoans((prevLoans) =>
      prevLoans.map((loan) =>
        loan.id === loanId 
          ? { 
              ...loan, 
              status: newStatus, 
              reviewedDate: new Date().toISOString().split('T')[0] 
            } 
          : loan
      )
    );

    setDashboard((prev) => ({
      ...prev,
      pendingLoans: Math.max(0, (prev?.pendingLoans || 0) - 1),
    }));

    setSelectedLoan(null);
  } catch (err) {
    console.error("Update Error:", err.response?.data || err.message);
    alert(`Failed to update: ${err.response?.data?.message || "Internal Server Error"}`);
  } finally {
    setRefreshing(false);
  }
};

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        
        {/* Header with Live Time */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <div className="flex items-center gap-2 text-slate-500 mt-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{currentTime.toLocaleDateString()}</span>
              <span className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <Button onClick={() => fetchAdminData(true)} variant="outline" className="shadow-sm" disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Portfolio" value={formatCurrency(overview?.totalPortfolioValue)} icon={DollarSign} loading={refreshing} />
          <StatCard title="Active Borrowers" value={overview?.activeLoans || 0} icon={Users} variant="accent" loading={refreshing} />
          <StatCard title="Avg Interest" value={`${overview?.averageInterestRate || 0}%`} icon={TrendingUp} variant="success" loading={refreshing} />
          <StatCard title="Awaiting Review" value={dashboard?.pendingLoans || 0} icon={Clock} variant="warning" loading={refreshing} />
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Loan Applications</CardTitle>
                <CardDescription>Manage and review incoming requests.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6">Applicant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Applied</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} className="hover:bg-blue-50/30 transition-colors group">
                    <TableCell className="pl-6 font-semibold text-slate-700">{loan.userName}</TableCell>
                    <TableCell className="font-medium text-slate-900">{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getCreditScoreCategory(loan.creditScore).color}`}>
                        {loan.creditScore} ({getCreditScoreCategory(loan.creditScore).label})
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[loan.status]} border shadow-sm`}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {/* FIXED DATE FIELD FOR DTO */}
                      {formatDate(loan.appliedDate)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded-full h-9 w-9 p-0"
                        onClick={() => setSelectedLoan(loan)}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Decision Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>Reviewing {selectedLoan?.userName}'s request.</DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Amount</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Credit Score</p>
                  <p className={`text-xl font-bold ${getCreditScoreCategory(selectedLoan.creditScore).color}`}>
                    {selectedLoan.creditScore}
                  </p>
                </div>
              </div>
              <div className="p-3 border rounded-lg flex justify-between items-center text-sm">
                <span className="text-slate-500">Loan Purpose</span>
                <span className="font-bold text-slate-700">{selectedLoan.purpose?.replace('_', ' ')}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 sm:space-x-2">
            {selectedLoan?.status === 'PENDING' ? (
              <>
                <Button variant="destructive" className="flex-1 shadow-sm" onClick={() => handleUpdateStatus(selectedLoan.id, 'REJECTED')}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 shadow-sm" onClick={() => handleUpdateStatus(selectedLoan.id, 'APPROVED')}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setSelectedLoan(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}