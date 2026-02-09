import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Car, 
  Heart,
  ArrowRight,
  Zap
} from 'lucide-react';

const loanProducts = [
  {
    id: 'PERSONAL',
    icon: Home,
    title: 'Personal Loans',
    description: "Flexible funding for life's important moments",
    rate: '6.99%',
    maxAmount: '$50,000',
    term: '12-60 months',
    features: ['No collateral required', 'Fixed interest rates', 'Quick approval', 'No prepayment penalties'],
  },
  {
    id: 'BUSINESS',
    icon: Briefcase,
    title: 'Business Loans',
    description: 'Fuel your business growth and expansion',
    rate: '7.49%',
    maxAmount: '$250,000',
    term: '12-84 months',
    features: ['Equipment financing', 'Working capital', 'Business expansion', 'Competitive rates'],
    featured: true,
  },
  {
    id: 'EDUCATION',
    icon: GraduationCap,
    title: 'Education Loans',
    description: 'Invest in your future with education financing',
    rate: '5.49%',
    maxAmount: '$100,000',
    term: '24-120 months',
    features: ['Low interest rates', 'Deferred payments', 'Tuition & living', 'Flexible repayment'],
  },
  {
    id: 'AUTO',
    icon: Car,
    title: 'Auto Loans',
    description: 'Drive away in your dream vehicle',
    rate: '4.99%',
    maxAmount: '$75,000',
    term: '12-72 months',
    features: ['New & used vehicles', 'Competitive rates', 'Fast approval', 'Flexible terms'],
  },
  {
    id: 'DEBT_CONSOLIDATION',
    icon: Heart,
    title: 'Debt Consolidation',
    description: 'Simplify your finances with one payment',
    rate: '5.99%',
    maxAmount: '$75,000',
    term: '24-72 months',
    features: ['Lower monthly payments', 'Single payment', 'Reduce interest', 'Improve credit score'],
  },
  {
    id: 'HOME_IMPROVEMENT',
    icon: Home,
    title: 'Home Improvement',
    description: 'Transform your home with renovation financing',
    rate: '6.49%',
    maxAmount: '$100,000',
    term: '12-84 months',
    features: ['Major renovations', 'Energy upgrades', 'Outdoor projects', 'Increase home value'],
  },
];

export default function Loans() {
  const navigate = useNavigate();

  const handleApply = (loanType) => {
    // Passes the selected loan type to the application page
    navigate('/apply', { state: { selectedType: loanType } });
  };

  return (
    <div className="min-h-screen bg-background selection:bg-secondary/30">
      <Navbar />
      
      {/* Page Header with Animated Background */}
      <section className="bg-slate-900 pt-40 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/20">
            <Zap className="h-3 w-3 mr-1 fill-current" /> Fast Tracking 2026
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Financial Solutions for <span className="text-secondary">Every Goal</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tailored loan products with fixed rates and no hidden fees. Get an instant decision in under 2 minutes.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-20 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loanProducts.map((product, index) => (
              <Card 
                key={product.id}
                className={`group relative overflow-hidden border-none shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${
                  product.featured ? 'ring-2 ring-secondary bg-white' : 'bg-white'
                }`}
              >
                {product.featured && (
                  <div className="absolute top-0 right-0 bg-secondary text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-sm">
                    Recommended
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-900 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                      <product.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{product.title}</CardTitle>
                      <div className="h-1 w-8 bg-secondary mt-1 rounded-full group-hover:w-16 transition-all duration-500"></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed min-h-[40px]">{product.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Financial Stats Bar */}
                  <div className="grid grid-cols-3 py-4 bg-slate-50 rounded-2xl border border-slate-100 gap-1">
                    <div className="text-center border-r border-slate-200">
                      <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">APR</p>
                      <p className="text-sm font-bold text-secondary">{product.rate}</p>
                    </div>
                    <div className="text-center border-r border-slate-200">
                      <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Up To</p>
                      <p className="text-sm font-bold text-slate-900">{product.maxAmount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Term</p>
                      <p className="text-sm font-bold text-slate-900">{product.term.split(' ')[0]}</p>
                    </div>
                  </div>

                  <ul className="space-y-3.5">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="bg-emerald-100 p-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full h-12 text-md font-bold transition-all" 
                    variant={product.featured ? 'default' : 'outline'}
                    onClick={() => handleApply(product.id)}
                  >
                    Apply Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive FAQ / Guidance Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-[32px] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Not sure which loan is right for you?</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                Take our 30-second quiz to get a personalized recommendation based on your credit profile and financial goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold h-14 px-8" onClick={() => navigate('/apply')}>
                  Start Loan Quiz
                </Button>
                <Button size="lg" variant="outline" className="text-white border-slate-700 hover:bg-slate-800 h-14 px-8">
                  Talk to an Advisor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Minimal Badge Component if not in your UI folder
function Badge({ children, className }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}