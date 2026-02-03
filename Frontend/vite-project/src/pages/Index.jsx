import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Calculator,
  Clock,
  Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Zap,
    title: 'Fast Approval',
    description: 'Get loan decisions within 24 hours with our streamlined process.',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Bank-level security with encrypted data and secure transactions.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Credit Scoring',
    description: 'Rule-based credit assessment for fair and transparent decisions.',
  },
  {
    icon: Users,
    title: 'Expert Support',
    description: 'Dedicated loan advisors to guide you through every step.',
  },
];

const loanTypes = [
  {
    title: 'Personal Loans',
    rate: '6.99%',
    amount: 'Up to $50,000',
    term: '12-60 months',
    features: ['No collateral required', 'Fixed interest rates', 'Flexible terms'],
  },
  {
    title: 'Business Loans',
    rate: '7.49%',
    amount: 'Up to $250,000',
    term: '12-84 months',
    features: ['Grow your business', 'Equipment financing', 'Working capital'],
    featured: true,
  },
  {
    title: 'Debt Consolidation',
    rate: '5.99%',
    amount: 'Up to $75,000',
    term: '24-72 months',
    features: ['Lower monthly payments', 'Single payment', 'Reduce interest'],
  },
];

const stats = [
  { value: '$250M+', label: 'Loans Funded' },
  { value: '15,000+', label: 'Happy Customers' },
  { value: '4.8/5', label: 'Customer Rating' },
  { value: '24hrs', label: 'Avg. Approval Time' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-hero overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary border border-secondary/20 animate-fade-up">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">Trusted by 15,000+ customers</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Smart Loans with
              <span className="text-gradient block">Intelligent Scoring</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Experience fast, fair, and secure lending powered by our advanced rule-based credit scoring system. Get the funds you need with transparent rates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Button variant="hero" size="xl" onClick={() => navigate('/auth?mode=register')}>
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => navigate('/loans')}>
                View Loan Options
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-secondary">{stat.value}</p>
                  <p className="text-sm text-primary-foreground/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 rounded-full bg-secondary" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose LoanPap
              ?</h2>
            <p className="text-muted-foreground text-lg">
              We combine cutting-edge technology with personalized service to deliver the best lending experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group hover:shadow-lg hover:border-secondary/20 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-secondary/10 text-secondary mb-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Types Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loan Products</h2>
            <p className="text-muted-foreground text-lg">
              Competitive rates and flexible terms tailored to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {loanTypes.map((loan, index) => (
              <Card 
                key={loan.title}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-fade-up ${
                  loan.featured ? 'border-secondary shadow-glow scale-105' : 'hover:border-secondary/30'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {loan.featured && (
                  <div className="absolute top-0 right-0 bg-gradient-accent text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="font-bold text-xl mb-4">{loan.title}</h3>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Starting at</span>
                      <span className="text-2xl font-bold text-secondary">{loan.rate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">{loan.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Term</span>
                      <span className="font-medium">{loan.term}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {loan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-secondary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={loan.featured ? 'hero' : 'outline'}
                    onClick={() => navigate('/auth?mode=register')}
                  >
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Get your loan in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, icon: Calculator, title: 'Apply Online', description: 'Fill out our simple application form in minutes. No paperwork needed.' },
              { step: 2, icon: Clock, title: 'Quick Review', description: 'Our smart credit scoring system evaluates your application instantly.' },
              { step: 3, icon: CheckCircle2, title: 'Get Funded', description: 'Once approved, receive funds directly to your bank account.' },
            ].map((item, index) => (
              <div 
                key={item.step} 
                className="relative text-center animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-secondary-foreground text-xl font-bold mb-4">
                  {item.step}
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-secondary to-transparent" />
                )}
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of satisfied customers who've achieved their financial goals with LoanPap.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate('/auth?mode=register')}>
            Apply for a Loan Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
