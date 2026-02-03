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
import { loanApi, userApi } from '@/lib/api';

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

const employmentTypes = [
  { value: 'FULL_TIME', label: 'Full-time Employee' },
  { value: 'PART_TIME', label: 'Part-time Employee' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
];

export default function Apply() {
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loanEstimate, setLoanEstimate] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Form state
  const [amount, setAmount] = useState(25000);
  const [term, setTerm] = useState(36);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [collateral, setCollateral] = useState('');
  const [creditScore, setCreditScore] = useState(user?.creditScore || 0);
  const [interestRate, setInterestRate] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Fetch user profile for pre-filled information
    const fetchUserProfile = async () => {
      try {
        const response = await userApi.getProfile();
        setUserProfile(response.data);
        
        // Pre-fill form with user data if available
        if (response.data.annualIncome) {
          // You can pre-fill income if needed
        }
        
        if (response.data.creditScore) {
          setCreditScore(response.data.creditScore);
        }
        
        if (response.data.employmentType) {
          // Pre-fill employment type
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, navigate]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal, rate, months) => {
    if (!principal || !rate || !months) return 0;
    
    const monthlyRate = rate / 100 / 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  // Check eligibility and calculate rates
  const checkEligibility = async () => {
    if (!purpose || amount < 1000) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsCalculating(true);
    
    try {
      // This would call your backend eligibility endpoint
      // For now, we'll simulate with a mock calculation
      const response = await fetch('/api/loans/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          term,
          purpose,
          userId: user.id,
          creditScore: userProfile?.creditScore || creditScore
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLoanEstimate(data);
        
        // Calculate interest rate based on credit score
        let calculatedRate;
        if (creditScore >= 750) calculatedRate = 6.5;
        else if (creditScore >= 700) calculatedRate = 8.0;
        else if (creditScore >= 650) calculatedRate = 10.5;
        else if (creditScore >= 600) calculatedRate = 12.0;
        else calculatedRate = 15.0;

        // Adjust rate based on amount
        if (amount > 50000) calculatedRate -= 0.5;
        else if (amount < 10000) calculatedRate += 0.5;

        // Adjust rate based on term
        if (term > 60) calculatedRate += 1.0;
        else if (term < 24) calculatedRate -= 0.5;

        setInterestRate(calculatedRate);
        
        // Calculate monthly payment
        const payment = calculateMonthlyPayment(amount, calculatedRate, term);
        setMonthlyPayment(payment);
        
        // Set eligibility
        setEligibility({
          eligible: true,
          maxAmount: amount * 2,
          suggestedTerm: term,
          reason: 'Approved based on credit profile'
        });

        toast.success('Eligibility check complete!');
      } else {
        throw new Error('Eligibility check failed');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast.error('Unable to check eligibility. Please try again.');
      
      // Fallback calculation
      const fallbackRate = 9.5;
      const payment = calculateMonthlyPayment(amount, fallbackRate, term);
      setInterestRate(fallbackRate);
      setMonthlyPayment(payment);
      setEligibility({
        eligible: true,
        maxAmount: amount,
        suggestedTerm: term,
        reason: 'Standard approval'
      });
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
        term: parseInt(term),
        purpose,
        description: description || purposeLabels[purpose] || purpose,
        collateral: collateral || 'None',
        interestRate: interestRate,
        status: 'PENDING'
      };

      const response = await loanApi.create(loanData);
      
      if (response.data) {
        toast.success('Application Submitted!', {
          description: 'Your loan application has been received. We\'ll review it within 24 hours.',
        });
        
        // Redirect to dashboard or application status page
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep2 = purpose !== '' && amount >= 1000;
  const canProceedStep3 = purpose !== '' && amount >= 1000 && interestRate > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress Tracker */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= s ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-20 h-1 ${step > s ? 'bg-secondary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Loan Configuration */}
          {step === 1 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>How much do you need?</CardTitle>
                <CardDescription>
                  Select your desired loan amount and repayment term.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Loan Amount</Label>
                    <span className="text-2xl font-bold text-secondary">{formatCurrency(amount)}</span>
                  </div>
                  <Slider
                    value={[amount]}
                    onValueChange={(value) => setAmount(value[0])}
                    min={1000}
                    max={100000}
                    step={1000}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatCurrency(1000)}</span>
                    <span>{formatCurrency(100000)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Repayment Term</Label>
                    <span className="text-xl font-semibold">{term} months ({Math.floor(term/12)} years)</span>
                  </div>
                  <Slider
                    value={[term]}
                    onValueChange={(value) => setTerm(value[0])}
                    min={12}
                    max={84}
                    step={12}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>12 months</span>
                    <span>84 months</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Loan Purpose <span className="text-red-500">*</span></Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanPurposes.map((p) => (
                        <SelectItem key={p} value={p}>
                          {purposeLabels[p] || p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {userProfile?.creditScore && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Current Credit Score</p>
                        <p className="text-2xl font-bold">{userProfile.creditScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Based on your profile</p>
                        <p className="text-sm font-medium">
                          {userProfile.creditScore >= 750 ? 'Excellent' : 
                           userProfile.creditScore >= 700 ? 'Good' :
                           userProfile.creditScore >= 650 ? 'Fair' : 'Poor'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  variant="hero" 
                  disabled={!canProceedStep2 || isCalculating}
                  onClick={() => {
                    checkEligibility();
                    setStep(2);
                  }}
                >
                  {isCalculating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Check Eligibility
                      <Calculator className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Loan Details & Review */}
          {step === 2 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Review your loan terms and provide additional information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Loan Summary Card */}
                <Card className="bg-secondary/10 border-secondary/20">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Loan Amount</p>
                        <p className="text-xl font-bold">{formatCurrency(amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Term</p>
                        <p className="text-xl font-bold">{term} months</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated APR</p>
                        <p className="text-xl font-bold">{interestRate.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Payment</p>
                        <p className="text-xl font-bold text-secondary">{formatCurrency(monthlyPayment)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Total Repayment</p>
                      <p className="text-lg font-bold">{formatCurrency(monthlyPayment * term)}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Additional Description (Optional)</Label>
                  <Textarea
                    placeholder="Provide more details about how you plan to use the loan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Collateral (Optional)</Label>
                  <Input
                    placeholder="e.g., Property, Vehicle, Savings..."
                    value={collateral}
                    onChange={(e) => setCollateral(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing collateral may improve your approval chances and interest rate.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{' '}
                      <a href="/terms" className="text-primary hover:underline">
                        Terms and Conditions
                      </a>{' '}
                      and understand that this is a formal loan application.
                    </Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    variant="hero" 
                    disabled={!termsAccepted || !canProceedStep3}
                    onClick={() => setStep(3)}
                    className="flex-1"
                  >
                    Final Review <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Final Review & Submission */}
          {step === 3 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>Final Review</CardTitle>
                <CardDescription>Please review your application before submitting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Application Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Loan Amount</p>
                      <p className="font-medium">{formatCurrency(amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term</p>
                      <p className="font-medium">{term} months</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purpose</p>
                      <p className="font-medium">{purposeLabels[purpose] || purpose}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-medium">{interestRate.toFixed(2)}% APR</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Monthly Payment</span>
                      <span className="text-2xl font-bold text-secondary">
                        {formatCurrency(monthlyPayment)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total repayment: {formatCurrency(monthlyPayment * term)}
                    </p>
                  </div>
                </div>

                {description && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Additional Notes</p>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      {description}
                    </p>
                  </div>
                )}

                {collateral && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Collateral</p>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      {collateral}
                    </p>
                  </div>
                )}

                {eligibility && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-success">Eligibility Check Passed</p>
                        <p className="text-sm text-success/80">{eligibility.reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      By submitting, you acknowledge that:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>This is a formal loan application</li>
                      <li>Your credit report may be checked</li>
                      <li>Approval is subject to verification</li>
                      <li>Rates are subject to final approval</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Edit Application
                    </Button>
                    <Button 
                      variant="hero" 
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Submit Application <FileText className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
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