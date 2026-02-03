import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  Calculator,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import api, { loanApi, userApi, formatCurrency } from '@/lib/api';

const loanPurposes = [
  'HOME_RENOVATION',
  'DEBT_CONSOLIDATION', 
  'BUSINESS_EXPANSION',
  'MEDICAL_EXPENSES',
  'EDUCATION',
  'VEHICLE_PURCHASE',
  'WEDDING',
  'TRAVEL',
  'OTHER'
];

const purposeLabels = {
  'HOME_RENOVATION': 'Home Renovation',
  'DEBT_CONSOLIDATION': 'Debt Consolidation',
  'BUSINESS_EXPANSION': 'Business Expansion',
  'MEDICAL_EXPENSES': 'Medical Expenses',
  'EDUCATION': 'Education',
  'VEHICLE_PURCHASE': 'Vehicle Purchase',
  'WEDDING': 'Wedding',
  'TRAVEL': 'Travel',
  'OTHER': 'Other'
};

export default function Apply() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Form state
  const [amount, setAmount] = useState(25000);
  const [term, setTerm] = useState(36);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [collateral, setCollateral] = useState('');
  const [interestRate, setInterestRate] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await userApi.getProfile();
        setUserProfile(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, navigate]);

  const calculateMonthlyPayment = (principal, rate, months) => {
    if (!principal || !rate || !months) return 0;
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const checkEligibility = async () => {
    if (!purpose || amount < 1000) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsCalculating(true);
    
    try {
      // Logic matching LoanService.java calculation
      const score = userProfile?.creditScore || 700;
      let baseRate = 6.5;
      let scoreAdj = (score >= 750) ? -2.0 : (score >= 700) ? -1.0 : (score >= 600) ? 1.5 : 3.0;
      let termAdj = (term > 60) ? 1.0 : (term > 36) ? 0.5 : 0;
      
      const calculatedRate = baseRate + scoreAdj + termAdj;
      const payment = calculateMonthlyPayment(amount, calculatedRate, term);

      setInterestRate(calculatedRate);
      setMonthlyPayment(payment);
      setEligibility({
        eligible: true,
        reason: score >= 650 ? 'Likely for auto-approval' : 'Requires manual review'
      });

      toast.success('Rate calculated successfully!');
      setStep(2);
    } catch (error) {
      toast.error('Unable to calculate rates.');
    } finally {
      setIsCalculating(false);
    }
  };
  const handleSubmit = async () => {
  if (!termsAccepted) {
    toast.error('Please accept the terms and conditions');
    return;
  }

  setIsSubmitting(true);
  
  try {
    const loanData = {
      amount: parseFloat(amount),
      termMonths: parseInt(term), // Renamed to match Java DTO
      purpose: purpose,
      description: description || purposeLabels[purpose] || purpose,
    };

    // Now this call will work because we added it to api.js
    const response = await loanApi.create(loanData);
    
    if (response.data) {
      toast.success('Application Submitted!', {
        description: 'Your loan application has been received successfully.',
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    const serverMessage = error.response?.data?.message;
    toast.error(serverMessage || 'Failed to submit application. Please try again.');
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

          {/* Step 1: Config */}
          {step === 1 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>How much do you need?</CardTitle>
                <CardDescription>Select your desired loan amount and repayment term.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Loan Amount</Label>
                    <span className="text-2xl font-bold text-secondary">{formatCurrency(amount)}</span>
                  </div>
                  <Slider value={[amount]} onValueChange={(v) => setAmount(v[0])} min={1000} max={100000} step={1000} className="py-4" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Repayment Term</Label>
                    <span className="text-xl font-semibold">{term} months</span>
                  </div>
                  <Slider value={[term]} onValueChange={(v) => setTerm(v[0])} min={12} max={84} step={12} className="py-4" />
                </div>

                <div className="space-y-2">
                  <Label>Loan Purpose <span className="text-red-500">*</span></Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      {loanPurposes.map((p) => (
                        <SelectItem key={p} value={p}>{purposeLabels[p] || p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" variant="hero" disabled={!purpose || isCalculating} onClick={checkEligibility}>
                  {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Check Eligibility <Calculator className="ml-2 h-4 w-4" /></>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Review your loan terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="bg-secondary/10 border-secondary/20">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-muted-foreground">Amount</p><p className="text-xl font-bold">{formatCurrency(amount)}</p></div>
                      <div><p className="text-sm text-muted-foreground">Term</p><p className="text-xl font-bold">{term} months</p></div>
                      <div><p className="text-sm text-muted-foreground">Estimated APR</p><p className="text-xl font-bold">{interestRate.toFixed(2)}%</p></div>
                      <div><p className="text-sm text-muted-foreground">Monthly Payment</p><p className="text-xl font-bold text-secondary">{formatCurrency(monthlyPayment)}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Additional Description (Optional)</Label>
                  <Textarea placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-4 w-4" />
                  <Label htmlFor="terms" className="text-sm">I agree to the Terms and Conditions</Label>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button variant="hero" disabled={!termsAccepted} onClick={() => setStep(3)} className="flex-1">Final Review</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Final Review */}
          {step === 3 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>Final Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Loan Amount</p><p className="font-medium">{formatCurrency(amount)}</p></div>
                    <div><p className="text-muted-foreground">Term</p><p className="font-medium">{term} months</p></div>
                    <div><p className="text-muted-foreground">Purpose</p><p className="font-medium">{purposeLabels[purpose]}</p></div>
                    <div><p className="text-muted-foreground">Interest Rate</p><p className="font-medium">{interestRate.toFixed(2)}% APR</p></div>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-muted-foreground">Monthly Payment</span>
                    <span className="text-2xl font-bold text-secondary">{formatCurrency(monthlyPayment)}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Edit</Button>
                  <Button variant="hero" disabled={isSubmitting} onClick={handleSubmit} className="flex-1">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
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