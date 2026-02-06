import { useEffect, useState, useCallback } from 'react';
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
import { adminApi, loanApi, formatCurrency, formatDate, getCreditScoreCategory } from '@/lib/api';
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  DISBURSED: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loans, setLoans] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [error, setError] = useState(null);

  // Use useCallback to prevent unnecessary re-renders
  const fetchAdminData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      
      const [loansResponse, analyticsResponse] = await Promise.all([
        adminApi.getAllLoans(0, 50),
        adminApi.getAnalytics()
      ]);

      // Spring Page object fix: data.content
      setLoans(loansResponse.data.content || []);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.status === 403 
        ? 'Access Denied: You do not have administrator privileges.' 
        : 'Failed to sync with server. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    // Check for ROLE_ prefix if your context includes it, or use .includes()
    const isAdmin = user?.role?.toUpperCase().includes('ADMIN');
    if (user && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, user, navigate, fetchAdminData]);

  const handleAction = async (loanId, action, note) => {
    try {
      if (action === 'approve') {
        await loanApi.approve(loanId, note);
      } else {
        await loanApi.reject(loanId, note);
      }
      setSelectedLoan(null);
      fetchAdminData(true); 
    } catch (err) {
      setError(`Failed to ${action} loan. Please check console.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm font-medium text-slate-500">Initializing Admin Panel...</p>
        </div>
      </div>
    );
  }

  const pendingLoans = loans.filter(l => l.status === 'PENDING');

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive system oversight and loan lifecycle management.</p>
          </div>
          <Button 
            onClick={() => fetchAdminData(true)} 
            variant="outline" 
            size="sm" 
            disabled={refreshing}
            className="bg-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-4 flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Portfolio" 
            value={formatCurrency(analytics?.totalLoanAmount || 0)} 
            icon={DollarSign} 
            loading={refreshing}
          />
          <StatCard 
            title="Active Borrowers" 
            value={analytics?.activeUsers || 0} 
            icon={Users} 
            variant="accent" 
            loading={refreshing}
          />
          <StatCard 
            title="Avg Interest Rate" 
            value={`${analytics?.averageInterestRate || 0}%`} 
            icon={TrendingUp} 
            variant="success" 
            loading={refreshing}
          />
          <StatCard 
            title="Awaiting Review" 
            value={pendingLoans.length} 
            icon={Clock} 
            variant={pendingLoans.length > 0 ? 'warning' : 'default'} 
            loading={refreshing}
          />
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="bg-white border p-1 shadow-sm">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Visual Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-0">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Loan Pipeline</CardTitle>
                <CardDescription>Review and manage all incoming and historical loan requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Risk Profile</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.length > 0 ? (
                        loans.map(loan => {
                          const score = getCreditScoreCategory(loan.creditScore);
                          return (
                            <TableRow key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="font-semibold text-slate-700">{loan.userName || 'Anonymous'}</TableCell>
                              <TableCell>{formatCurrency(loan.amount)}</TableCell>
                              <TableCell>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 ${score.color}`}>
                                  {loan.creditScore} • {score.label}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${statusColors[loan.status]} font-bold`}>
                                  {loan.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-500">{formatDate(loan.appliedDate)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLoan(loan)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                            No loan applications found in the system.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.statusDistribution || []}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {analytics?.statusDistribution?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Volume Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        formatter={(value) => formatCurrency(value)} 
                      />
                      <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Loan Review Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Application Review</DialogTitle>
            <DialogDescription>Reference ID: {selectedLoan?.id}</DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-slate-50 rounded-lg border">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase">Applicant</p>
                  <p className="font-bold text-slate-900">{selectedLoan.userName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase">Amount</p>
                  <p className="font-bold text-slate-900">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase">Purpose</p>
                  <p className="font-medium capitalize">{selectedLoan.purpose.toLowerCase().replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase">Duration</p>
                  <p className="font-medium">{selectedLoan.termMonths} Months</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2">
            {selectedLoan?.status === 'PENDING' ? (
              <>
                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleAction(selectedLoan.id, 'reject', 'Internal risk assessment')}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAction(selectedLoan.id, 'approve', 'Credit check passed')}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            ) : (
              <Button variant="secondary" className="w-full" onClick={() => setSelectedLoan(null)}>Dismiss</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}