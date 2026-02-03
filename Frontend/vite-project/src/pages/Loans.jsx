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
  ArrowRight
} from 'lucide-react';

const loanProducts = [
  {
    icon: Home,
    title: 'Personal Loans',
    description: "Flexible funding for life's important moments",
    rate: '6.99%',
    maxAmount: '$50,000',
    term: '12-60 months',
    features: ['No collateral required', 'Fixed interest rates', 'Quick approval', 'No prepayment penalties'],
  },
  {
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
    icon: GraduationCap,
    title: 'Education Loans',
    description: 'Invest in your future with education financing',
    rate: '5.49%',
    maxAmount: '$100,000',
    term: '24-120 months',
    features: ['Low interest rates', 'Deferred payments', 'Tuition & living', 'Flexible repayment'],
  },
  {
    icon: Car,
    title: 'Auto Loans',
    description: 'Drive away in your dream vehicle',
    rate: '4.99%',
    maxAmount: '$75,000',
    term: '12-72 months',
    features: ['New & used vehicles', 'Competitive rates', 'Fast approval', 'Flexible terms'],
  },
  {
    icon: Heart,
    title: 'Debt Consolidation',
    description: 'Simplify your finances with one payment',
    rate: '5.99%',
    maxAmount: '$75,000',
    term: '24-72 months',
    features: ['Lower monthly payments', 'Single payment', 'Reduce interest', 'Improve credit score'],
  },
  {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Page Header */}
      <section className="bg-hero pt-32 pb-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 animate-fade-up">
            Our Loan Products
          </h1>
          <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Tailored financial solutions with transparent terms and competitive rates.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-20 -mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loanProducts.map((product, index) => (
              <Card 
                key={product.title}
                className={`group border-none shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-fade-up ${
                  product.featured ? 'ring-2 ring-secondary' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {product.featured && (
                  <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-2xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                      <product.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">{product.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Financial Quick-Look Table */}
                  <div className="grid grid-cols-3 py-4 border-y border-muted/50 gap-2">
                    <div className="text-center border-r border-muted/50">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Rates</p>
                      <p className="text-md font-bold text-secondary">{product.rate}</p>
                    </div>
                    <div className="text-center border-r border-muted/50">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Max</p>
                      <p className="text-md font-bold">{product.maxAmount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Term</p>
                      <p className="text-md font-bold">{product.term.split(' ')[0]}</p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full shadow-sm" 
                    variant={product.featured ? 'hero' : 'outline'}
                    onClick={() => navigate('/apply')}
                  >
                    Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Advisor CTA */}
      <section className="py-24 border-t bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Need Expert Guidance?</h2>
            <p className="text-muted-foreground">
              Choosing a loan is a big decision. Our advisors are available 24/7 to help you compare products and find the best fit for your financial goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="hero" onClick={() => navigate('/apply')}>Start Application</Button>
              <Button size="lg" variant="outline">Schedule a Call</Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}