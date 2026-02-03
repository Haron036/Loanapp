import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
// Import your local images here
import aronImg from '../assets/Aron.jpeg';
import JimmyImg from '../assets/Jimmy.jpeg';
import haronImg from '../assets/Haron.jpeg';
import emilioImg from '../assets/Emilio.jpeg';

import { 
  Shield, 
  Users, 
  TrendingUp, 
  Award,
  ArrowRight,
  Target,
  Heart,
  Lightbulb
} from 'lucide-react';

const stats = [
  { value: '$250M+', label: 'Loans Funded' },
  { value: '15,000+', label: 'Happy Customers' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24hrs', label: 'Avg. Approval' },
];

const values = [
  {
    icon: Shield,
    title: 'Trust & Security',
    description: 'We protect your data with bank-level encryption and never compromise on security.',
  },
  {
    icon: Target,
    title: 'Transparency',
    description: 'No hidden fees, clear terms, and honest communication at every step.',
  },
  {
    icon: Heart,
    title: 'Customer First',
    description: "Your financial success is our priority. We're here to help you achieve your goals.",
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We leverage smart technology to make lending faster, fairer, and more accessible.',
  },
];

// Updated team array using the imported variables
const team = [
  { name: 'Aron Ngetich', role: 'CEO & Founder', image: haronImg },
  { name: 'Emilio Ngetich', role: 'Chief Technology Officer', image: emilioImg },
  { name: 'Jimmy', role: 'Head of Credit', image: JimmyImg },
  { name: 'Haron', role: 'Chief Operations Officer', image: aronImg },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-hero pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 animate-fade-up">
              Reimagining Lending for the Modern World
            </h1>
            <p className="text-xl text-primary-foreground/70 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              We're on a mission to make financial services accessible, transparent, and fair for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 -mt-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={stat.label} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl md:text-4xl font-bold text-secondary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Our Story</h2>
              <p className="text-muted-foreground">
                LoanPap was founded in 2026 with a simple belief: everyone deserves access to fair, transparent lending. Traditional banks had made borrowing complicated, expensive, and often inaccessible to those who needed it most.
              </p>
              <p className="text-muted-foreground">
                We built a platform that combines cutting-edge technology with human understanding. Our rule-based credit scoring system evaluates applicants fairly, considering multiple factors beyond just credit history.
              </p>
              <p className="text-muted-foreground">
                Today, we've helped over 15,000 customers achieve their financial goals.
              </p>
              <Button variant="hero" onClick={() => navigate('/auth?mode=register')}>
                Join Our Community
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="h-16 w-16 text-secondary" />
                </div>
                <div className="h-32 rounded-lg bg-muted flex items-center justify-center">
                  <Award className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-32 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="h-48 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Shield className="h-16 w-16 text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Leadership Team</h2>
            <p className="text-muted-foreground">
              Meet the people driving innovation in lending.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card 
                key={member.name} 
                className="text-center hover:shadow-lg transition-all animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}