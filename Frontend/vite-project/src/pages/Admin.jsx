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
import { Users, DollarSign, TrendingUp, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  DISBURSED: 'bg-blue-100 text-blue-700 border-blue-200',
  REPAYING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loans, setLoans] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [overview, setOverview] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [error, setError] = useState(null);

  const fetchAdminData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      
      const [loansRes, dashboardRes, overviewRes] = await Promise.all([
        adminApi.getAllLoans(0, 50),
        adminApi.getDashboardAnalytics(),
        adminApi.getOverviewAnalytics()
      ]);

      setLoans(loansRes.data.content || []);
      setDashboard(dashboardRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      setError(err.response?.status === 403 
        ? 'Access Denied: Admin privileges required.' 
        : 'Failed to sync with server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return navigate('/auth');
    if (user && !user.role?.toUpperCase().includes('ADMIN')) return navigate('/dashboard');
    fetchAdminData();
  }, [isAuthenticated, user, navigate, fetchAdminData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive system oversight.</p>
          </div>
          <Button onClick={() => fetchAdminData(true)} variant="outline" disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>

        {/* Updated StatCards to match backend DTO fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Portfolio" 
            value={formatCurrency(overview?.totalPortfolioValue || 0)} 
            icon={DollarSign} 
            loading={refreshing} 
          />
          <StatCard 
            title="Active Borrowers" 
            value={overview?.activeLoans || 0} 
            icon={Users} 
            variant="accent" 
            loading={refreshing} 
          />
          <StatCard 
            title="Avg Interest Rate" 
            value={`${overview?.averageInterestRate || 0}%`} 
            icon={TrendingUp} 
            variant="success" 
            loading={refreshing} 
          />
          <StatCard 
            title="Awaiting Review" 
            value={dashboard?.pendingLoans || 0} 
            icon={Clock} 
            variant="warning" 
            loading={refreshing} 
          />
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Visual Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map(loan => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.userName}</TableCell>
                        <TableCell>{formatCurrency(loan.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[loan.status]}>{loan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedLoan(loan)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card>
                  <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={overview?.riskDistribution ? Object.entries(overview.riskDistribution).map(([name, value]) => ({ name, value })) : []} 
                          dataKey="value" 
                          innerRadius={60} 
                          outerRadius={80}
                        >
                          {CHART_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
               </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}