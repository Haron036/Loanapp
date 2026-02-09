import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, Calculator, ArrowRight, ArrowLeft, Info, Landmark } from 'lucide-react';
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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step Management
  const [step, setStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data State
  const [userProfile, setUserProfile] = useState(null);
  const [amount, setAmount] = useState(50000); 
  const [term, setTerm] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Calculation Results
  const [interestRate, setInterestRate] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalRepayment, setTotalRepayment] = useState(0);

  // 1. Authentication and Profile Sync
  useEffect(() => {
    if (!isAuthenticated) return navigate('/auth');
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        setUserProfile(res.data);
      } catch (err) {
        console.error('Profile fetch failed', err);
      }
    };
    fetchProfile();
  }, [isAuthenticated, navigate]);

  // 2. Financial Formula
  const calculateLoan = (principal, annualRate, months) => {
    if (!principal || !annualRate || !months) return 0;
    const monthlyRate = annualRate / 100 / 12;
    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                   (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  // 3. Live Preview (Step 1)
  useEffect(() => {
    const previewRate = 14.0; // Baseline KES market rate for estimation
    const estimatedMonthly = calculateLoan(amount, previewRate, term);
    setMonthlyPayment(estimatedMonthly);
    setTotalRepayment(estimatedMonthly * term);
  }, [amount, term]);

  // 4. Eligibility Logic (Step 2 transition)
  const checkEligibility = async () => {
    if (!purpose) {
      return toast({
        title: "Information Required",
        description: "Please select a loan purpose to see your rate.",
        variant: "destructive"
      });
    }

    setIsCalculating(true);
    // Simulate scoring logic delay
    setTimeout(() => {
      const score = userProfile?.creditScore || 650;
      let baseRate = 12.5; 
      let scoreAdj = score >= 720 ? -3 : score >= 650 ? -1 : 3.5;
      let termAdj = term > 36 ? 1.5 : 0;

      const finalRate = baseRate + scoreAdj + termAdj;
      const finalPayment = calculateLoan(amount, finalRate, term);

      setInterestRate(finalRate);
      setMonthlyPayment(finalPayment);
      setTotalRepayment(finalPayment * term);
      
      setIsCalculating(false);
      setStep(2);
      toast({
        title: "Eligibility Confirmed",
        description: `We've calculated a personalized rate of ${finalRate.toFixed(2)}% APR for you.`,
      });
    }, 1000);
  };

  // 5. Final Submission
  const handleSubmit = async () => {
    if (!termsAccepted) {
      return toast({ title: "Agreement Required", description: "Accept terms to proceed.", variant: "destructive" });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        termMonths: parseInt(term),
        purpose,
        description: description || purposeLabels[purpose]
      };

      await loanApi.create(payload);
      toast({ title: "Application Sent!", description: "You will be notified once reviewed." });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      toast({
        title: "Submission Error",
        description: err.response?.data?.message || "Failed to submit application.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Progress Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Apply for a Loan</h1>
            <p className="text-slate-500 text-sm">Follow the three simple steps to secure your funding.</p>
            
            <div className="flex items-center justify-center mt-8 gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                    step >= s ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && <div className={`w-12 h-0.5 mx-1 ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: CALCULATOR */}
          {step === 1 && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
              <div className="h-2 bg-primary/20 w-full" />
              <CardHeader>
                <CardTitle>Configure Your Loan</CardTitle>
                <CardDescription>Adjust the sliders to estimate your repayment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Amount Needed</Label>
                    <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(amount)}</span>
                  </div>
                  <Slider value={[amount]} min={10000} max={1000000} step={10000} onValueChange={(v) => setAmount(v[0])} className="py-2" />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>KSh 10,000</span>
                    <span>KSh 1.0M</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Repayment Term</Label>
                    <span className="text-xl font-bold">{term} Months</span>
                  </div>
                  <Slider value={[term]} min={3} max={60} step={3} onValueChange={(v) => setTerm(v[0])} className="py-2" />
                </div>

                {/* Estimate Box */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <Landmark size={60} />
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Info size={12} /> Estimated Installment
                    </span>
                    <span className="text-lg font-bold text-emerald-400">{formatCurrency(monthlyPayment)}/mo</span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Repayment</p>
                      <p className="text-xl font-black">{formatCurrency(totalRepayment)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Interest Rate</p>
                      <p className="text-sm font-bold text-slate-300">~14.0% APR</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">What is this loan for?</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors">
                      <SelectValue placeholder="Select purpose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loanPurposes.map((p) => <SelectItem key={p} value={p}>{purposeLabels[p]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button size="lg" className="w-full h-14 text-md font-black shadow-lg shadow-primary/20" disabled={!purpose || isCalculating} onClick={checkEligibility}>
                  {isCalculating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>SEE MY ACTUAL RATE <ArrowRight className="ml-2 h-5 w-5" /></>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: OFFERS & REVIEWS */}
          {step === 2 && (
            <Card className="animate-in fade-in slide-in-from-right-8 duration-500 border-none shadow-2xl">
              <CardHeader className="border-b border-slate-50">
                <CardTitle>Great news! You qualify.</CardTitle>
                <CardDescription>We've analyzed your profile and generated an offer.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Your Interest Rate</p>
                      <p className="text-2xl font-black text-emerald-700">{interestRate.toFixed(2)}% <span className="text-xs font-normal">APR</span></p>
                   </div>
                   <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-[10px] font-bold text-primary uppercase mb-1">Final Installment</p>
                      <p className="text-2xl font-black text-primary">{formatCurrency(monthlyPayment)}</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Application Note</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more about your project (optional)..." rows={4} className="resize-none" />
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                  <input type="checkbox" id="legal" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-primary" />
                  <Label htmlFor="legal" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                    I verify that I am over 18 years old and I agree to the <span className="text-primary font-bold underline">Credit Agreement</span> and authorize a check on my CRB status.
                  </Label>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button className="flex-1 h-12 font-bold" disabled={!termsAccepted} onClick={() => setStep(3)}>Verify Summary</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: FINAL CONFIRMATION */}
          {step === 3 && (
            <Card className="animate-in zoom-in-95 duration-300 border-none shadow-2xl overflow-hidden">
              <div className="bg-green-500 p-8 text-white text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Final Review</p>
                <h2 className="text-4xl font-black">{formatCurrency(monthlyPayment)}</h2>
                <p className="text-xs opacity-80">per month for {term} months</p>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                   <div className="flex justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-green-400">Principal Amount</span>
                      <span className="font-bold">{formatCurrency(amount)}</span>
                   </div>
                   <div className="flex justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-green-400">Total Interest</span>
                      <span className="font-bold text-red-500">{formatCurrency(totalRepayment - amount)}</span>
                   </div>
                   <div className="flex justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-green-400">Purpose</span>
                      <span className="font-bold">{purposeLabels[purpose]}</span>
                   </div>
                   <div className="flex justify-between pt-4 text-lg">
                      <span className="font-black">Total to Repay</span>
                      <span className="font-black text-green-500">{formatCurrency(totalRepayment)}</span>
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" className="flex-1 h-14" onClick={() => setStep(2)}>Edit Offer</Button>
                  <Button size="lg" className="flex-1 h-14 font-black text-lg shadow-xl" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'CONFIRM & APPLY'}
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

const SuccessState = ({ onDashboard }) => (
  <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500 py-12">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-25" />
      <div className="relative bg-emerald-500 text-white p-6 rounded-full shadow-xl">
        <CheckCircle size={60} strokeWidth={3} />
      </div>
    </div>
    
    <h2 className="text-3xl font-black text-green-500 mb-4">Application Received!</h2>
    <p className="text-green-500 max-w-sm mb-8 leading-relaxed">
      Your loan application is now being processed. Our team typically reviews requests within 2 to 24 hours.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg mb-10">
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="text-emerald-500 font-bold mb-1">01</div>
        <p className="text-[10px] uppercase font-bold text-slate-400">Review</p>
        <p className="text-xs font-semibold">Credit Check</p>
      </div>
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 opacity-50">
        <div className="text-slate-300 font-bold mb-1">02</div>
        <p className="text-[10px] uppercase font-bold text-slate-400">Approval</p>
        <p className="text-xs font-semibold">Digital Signing</p>
      </div>
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 opacity-50">
        <div className="text-slate-300 font-bold mb-1">03</div>
        <p className="text-[10px] uppercase font-bold text-slate-400">Funding</p>
        <p className="text-xs font-semibold">MPESA/Bank</p>
      </div>
    </div>

    <Button onClick={onDashboard} size="lg" className="px-10 rounded-full font-bold">
      Go to Dashboard
    </Button>
  </div>
);