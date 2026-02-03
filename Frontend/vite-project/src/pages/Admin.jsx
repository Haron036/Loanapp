import { useEffect, useState } from 'react';
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
  adminApi,
  loanApi,
  formatCurrency, 
  formatDate,
  getCreditScoreCategory
} from '../lib/api.js';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  Eye,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statusColors = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  disbursed: 'bg-secondary/10 text-secondary border-secondary/20',
  repaying: 'bg-secondary/10 text-secondary border-secondary/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

const CHART_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loans, setLoans] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else if (user?.role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchAdminData();
    }
  }, [isAuthenticated, user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [loansResponse, analyticsResponse] = await Promise.all([
        adminApi.getAllLoans(),
        adminApi.getAnalytics()
      ]);
      setLoans(loansResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const pendingLoans = loans.filter(l => l.status === 'pending');

  const handleApprove = async (loanId) => {
    try {
      await loanApi.approve(loanId, 'Approved by admin');
      // Refresh data
      fetchAdminData();
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleReject = async (loanId) => {
    try {
      await loanApi.reject(loanId, 'Rejected by admin');
      // Refresh data
      fetchAdminData();
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error rejecting loan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage loan applications and view analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Applications"
            value={analytics?.totalApplications || 0}
            icon={Users}
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Total Disbursed"
            value={formatCurrency(analytics?.totalDisbursed || 0)}
            icon={DollarSign}
            variant="accent"
          />
          <StatCard
            title="Avg Credit Score"
            value={analytics?.averageCreditScore || 0}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Pending Review"
            value={pendingLoans.length}
            icon={Clock}
            variant={pendingLoans.length > 0 ? 'warning' : 'default'}
          />
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {pendingLoans.length > 0 && (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-warning/10 text-warning">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Pending Applications</h3>
                      <p className="text-sm text-muted-foreground">
                        You have {pendingLoans.length} application(s) awaiting review.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All Applications</CardTitle>
                <CardDescription>Review and manage loan applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Credit Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => {
                      const scoreCategory = getCreditScoreCategory(loan.creditScore);
                      return (
                        <TableRow key={loan.id}>
                          <TableCell className="font-mono text-sm">{loan.id}</TableCell>
                          <TableCell className="font-medium">{loan.userName || loan.user?.name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{loan.purpose}</TableCell>
                          <TableCell>
                            <span className={scoreCategory.color}>
                              {loan.creditScore} ({scoreCategory.label})
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[loan.status]}>
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(loan.appliedAt || loan.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedLoan(loan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.monthlyApplications || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--secondary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loan Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.loansByStatus || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {(analytics?.loansByStatus || []).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Key Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-success">
                        {analytics ? Math.round((analytics.approvedLoans / analytics.totalApplications) * 100) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Approval Rate</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-secondary">
                        {formatCurrency(analytics?.avgLoanSize || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Loan Size</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">
                        {analytics ? Math.round((analytics.totalRepaid / analytics.totalDisbursed) * 100) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Collection Rate</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-warning">
                        {analytics?.pendingLoans || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Loan #{selectedLoan?.id} - {selectedLoan?.userName || selectedLoan?.user?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Requested</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proposed Rate</p>
                  <p className="font-semibold text-lg">{selectedLoan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="font-semibold">{selectedLoan.term} months</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-semibold">{selectedLoan.purpose}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Credit Assessment</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{selectedLoan.creditScore}</p>
                    <p className={`text-sm ${getCreditScoreCategory(selectedLoan.creditScore).color}`}>
                      {getCreditScoreCategory(selectedLoan.creditScore).label}
                    </p>
                  </div>
                  <Badge variant={selectedLoan.creditScore >= 650 ? 'default' : 'destructive'}>
                    {selectedLoan.creditScore >= 650 ? 'Eligible' : 'High Risk'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="font-semibold text-secondary text-lg">
                  {formatCurrency(selectedLoan.monthlyPayment)}
                </p>
              </div>
            </div>
          )}
          {selectedLoan?.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button 
                variant="destructive" 
                onClick={() => handleReject(selectedLoan.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                variant="success"
                onClick={() => handleApprove(selectedLoan.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}