import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { loanApi, userApi, formatCurrency } from '@/lib/api';

const loanPurposes = [
  'HOME_RENOVATION', 'DEBT_CONSOLIDATION', 'BUSINESS_EXPANSION',
  'MEDICAL_EXPENSES', 'EDUCATION', 'VEHICLE_PURCHASE',
  'WEDDING', 'TRAVEL', 'OTHER'
];

const purposeLabels = {
  HOME_RENOVATION: 'Home Renovation',
  DEBT_CONSOLIDATION: 'Debt Consolidation',
  BUSINESS_EXPANSION: 'Business Expansion',
  MEDICAL_EXPENSES: 'Medical Expenses',
  EDUCATION: 'Education',
  VEHICLE_PURCHASE: 'Vehicle Purchase',
  WEDDING: 'Wedding',
  TRAVEL: 'Travel',
  OTHER: 'Other'
};

export default function Apply() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [amount, setAmount] = useState(25000);
  const [term, setTerm] = useState(36);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [interestRate, setInterestRate] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // Redirect if not authenticated and fetch user profile
  useEffect(() => {
    if (!isAuthenticated) return navigate('/auth');

    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        setUserProfile(res.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate]);

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal, rate, months) => {
    if (!principal || !rate || !months) return 0;
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  // Step 1: Check eligibility and calculate interest
  const checkEligibility = async () => {
    if (!purpose || amount < 1000) {
      return toast.error('Please complete all required fields');
    }

    setIsCalculating(true);
    try {
      const score = userProfile?.creditScore || 700;
      let baseRate = 6.5;
      let scoreAdj = score >= 750 ? -2 : score >= 700 ? -1 : score >= 600 ? 1.5 : 3;
      let termAdj = term > 60 ? 1 : term > 36 ? 0.5 : 0;

      const rate = baseRate + scoreAdj + termAdj;
      const payment = calculateMonthlyPayment(amount, rate, term);

      setInterestRate(rate);
      setMonthlyPayment(payment);
      toast.success('Rate calculated successfully!');
      setStep(2);
    } catch (err) {
      toast.error('Unable to calculate rates.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Step 3: Submit loan application
  const handleSubmit = async () => {
    if (!termsAccepted) return toast.error('Please accept the terms and conditions');

    setIsSubmitting(true);
    try {
      const loanData = {
        amount: parseFloat(amount),
        termMonths: parseInt(term),
        purpose,
        description: description || purposeLabels[purpose]
      };

      await loanApi.create(loanData);
      toast.success('Application Submitted!', { description: 'Your loan application has been received.' });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      const message = err.response?.data?.message || 'Failed to submit application.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress Tracker */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 3 && <div className={`w-20 h-1 ${step > s ? 'bg-secondary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>Loan Amount & Term</CardTitle>
                <CardDescription>Select your loan amount and repayment term.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Loan Amount</Label>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-secondary">{formatCurrency(amount)}</span>
                  </div>
                  <Slider value={[amount]} min={1000} max={100000} step={1000} onValueChange={(v) => setAmount(v[0])} />
                </div>

                <div>
                  <Label>Repayment Term</Label>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">{term} months</span>
                  </div>
                  <Slider value={[term]} min={12} max={84} step={12} onValueChange={(v) => setTerm(v[0])} />
                </div>

                <div>
                  <Label>Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      {loanPurposes.map((p) => (
                        <SelectItem key={p} value={p}>{purposeLabels[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="hero" className="w-full" disabled={!purpose || isCalculating} onClick={checkEligibility}>
                  {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Check Eligibility <Calculator className="ml-2 h-4 w-4" /></>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Review your loan terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Amount</p><p className="font-bold">{formatCurrency(amount)}</p></div>
                  <div><p className="text-muted-foreground">Term</p><p className="font-bold">{term} months</p></div>
                  <div><p className="text-muted-foreground">Interest Rate</p><p className="font-bold">{interestRate.toFixed(2)}%</p></div>
                  <div><p className="text-muted-foreground">Monthly Payment</p><p className="font-bold text-secondary">{formatCurrency(monthlyPayment)}</p></div>
                </div>

                <div>
                  <Label>Additional Description (Optional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Details..." />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-4 w-4" />
                  <Label className="text-sm">I agree to the Terms and Conditions</Label>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button variant="hero" className="flex-1" disabled={!termsAccepted} onClick={() => setStep(3)}>Final Review</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Card className="animate-fade-up">
              <CardHeader><CardTitle>Final Review</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{formatCurrency(amount)}</p></div>
                  <div><p className="text-muted-foreground">Term</p><p className="font-medium">{term} months</p></div>
                  <div><p className="text-muted-foreground">Purpose</p><p className="font-medium">{purposeLabels[purpose]}</p></div>
                  <div><p className="text-muted-foreground">Interest Rate</p><p className="font-medium">{interestRate.toFixed(2)}%</p></div>
                </div>

                <div className="pt-4 border-t flex justify-between">
                  <span className="text-muted-foreground">Monthly Payment</span>
                  <span className="text-2xl font-bold text-secondary">{formatCurrency(monthlyPayment)}</span>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Edit</Button>
                  <Button variant="hero" className="flex-1" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Application'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
