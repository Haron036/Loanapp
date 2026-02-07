import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '../lib/api.js'; 
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ShieldPlus, UserPlus } from 'lucide-react';

export default function AdminRegister() {
  const { user, isAuthenticated } = useAuth();
  
  const initialForm = {
    name: '', email: '', password: '', phone: '',
    address: '', city: '', state: '', zipCode: '',
    dateOfBirth: '', annualIncome: '', employmentType: 'FULL_TIME', monthlyDebt: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  /**
   * SECURITY LOGIC:
   * 1. If an admin is logged in, they can see this page.
   * 2. If NO ONE is logged in, we allow access so the first admin can be created (Bootstrap).
   * 3. If a regular USER is logged in, access is denied.
   */
  const isBootstrapMode = !isAuthenticated;
  const isAdmin = user?.role?.toUpperCase().includes('ADMIN');

  if (isAuthenticated && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold">Unauthorized Access</h1>
        <p className="text-slate-500">Only system administrators can provision new accounts.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const payload = {
        ...formData,
        annualIncome: parseFloat(formData.annualIncome) || 0,
        monthlyDebt: parseFloat(formData.monthlyDebt) || 0
      };

      const res = await adminApi.registerAdmin(payload);
      setStatus({ 
        type: 'success', 
        message: `Admin account for ${res.data.name} created successfully.` 
      });
      setFormData(initialForm); // Reset form on success
    } catch (err) {
      // If backend count > 0 and user isn't auth'd, backend returns 403
      const errorMsg = err.response?.status === 403 
        ? "System setup is complete. Please login as an admin to create more accounts."
        : err.response?.data?.message || 'Failed to register admin';
      
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-xl border mt-10 mb-20">
      <div className="flex items-center gap-3 mb-2">
        {isBootstrapMode ? <ShieldPlus className="h-6 w-6 text-blue-600" /> : <UserPlus className="h-6 w-6 text-blue-600" />}
        <h2 className="text-2xl font-bold text-slate-800">
          {isBootstrapMode ? 'System Bootstrap' : 'New Administrator'}
        </h2>
      </div>
      <p className="text-slate-500 mb-8 text-sm">
        {isBootstrapMode 
          ? 'Initializing the first administrative account for this instance.' 
          : 'Provisioning additional administrative credentials.'}
      </p>
      
      {status.message && (
        <Alert className={`mb-6 ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          {status.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={status.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>
            {status.message}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Info */}
        <div className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Personal Identity</div>
        <Input name="name" value={formData.name} placeholder="Full Legal Name" onChange={handleChange} required />
        <Input name="email" type="email" value={formData.email} placeholder="Work Email" onChange={handleChange} required />
        <Input name="password" type="password" value={formData.password} placeholder="Secure Password" onChange={handleChange} required />
        <Input name="phone" value={formData.phone} placeholder="Contact Number" onChange={handleChange} required />

        {/* Location Info */}
        <div className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Address Details</div>
        <div className="md:col-span-2"><Input name="address" value={formData.address} placeholder="Street Address" onChange={handleChange} required /></div>
        <Input name="city" value={formData.city} placeholder="City" onChange={handleChange} required />
        <div className="grid grid-cols-2 gap-2">
            <Input name="state" value={formData.state} placeholder="State" onChange={handleChange} required />
            <Input name="zipCode" value={formData.zipCode} placeholder="Zip" onChange={handleChange} required />
        </div>

        {/* Financial Context (Required for the User Entity defaults) */}
        <div className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Administrative Profile</div>
        <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
        <Input name="annualIncome" type="number" value={formData.annualIncome} placeholder="Annual Income" onChange={handleChange} required />

        <Button className="md:col-span-2 w-full bg-slate-900 hover:bg-black text-white h-11 mt-6" type="submit" disabled={loading}>
          {loading ? 'Processing...' : isBootstrapMode ? 'Initialize System' : 'Create Administrator'}
        </Button>
      </form>
    </div>
  );
}