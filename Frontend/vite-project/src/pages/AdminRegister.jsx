import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export default function AdminRegister() {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    ssnLastFour: '',
    dateOfBirth: '',
    annualIncome: '',
    employmentType: 'FULL_TIME', // default
    monthlyDebt: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Block non-admin users
  if (!user || user.role?.toLowerCase() !== 'admin') return <p>Access denied</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // convert numeric fields
      const payload = {
        ...formData,
        annualIncome: parseFloat(formData.annualIncome) || 0,
        monthlyDebt: parseFloat(formData.monthlyDebt) || 0
      };

      const res = await axios.post('http://localhost:8080/api/admin/register', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`✅ Admin registered: ${res.data.name}`);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        ssnLastFour: '',
        dateOfBirth: '',
        annualIncome: '',
        employmentType: 'FULL_TIME',
        monthlyDebt: ''
      });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '❌ Failed to register admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Register New Admin</h2>
      {message && <p className={`mb-4 ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        <Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <Input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <Input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
        <Input name="address" placeholder="Address" value={formData.address} onChange={handleChange} />
        <Input name="city" placeholder="City" value={formData.city} onChange={handleChange} />
        <Input name="state" placeholder="State" value={formData.state} onChange={handleChange} />
        <Input name="zipCode" placeholder="Zip Code" value={formData.zipCode} onChange={handleChange} />
        <Input name="ssnLastFour" placeholder="SSN Last 4" value={formData.ssnLastFour} onChange={handleChange} />
        <Input name="dateOfBirth" type="date" placeholder="Date of Birth" value={formData.dateOfBirth} onChange={handleChange} />
        <Input name="annualIncome" type="number" placeholder="Annual Income" value={formData.annualIncome} onChange={handleChange} />
        <select
          name="employmentType"
          value={formData.employmentType}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="SELF_EMPLOYED">Self Employed</option>
          <option value="UNEMPLOYED">Unemployed</option>
        </select>
        <Input name="monthlyDebt" type="number" placeholder="Monthly Debt" value={formData.monthlyDebt} onChange={handleChange} />

        <Button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register Admin'}
        </Button>
      </form>
    </div>
  );
}
