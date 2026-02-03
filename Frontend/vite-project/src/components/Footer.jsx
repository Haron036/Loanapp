import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-accent flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold">LoanPap</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Smart lending solutions powered by intelligent credit scoring. Your trusted partner for personal and business loans.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
              <li><Link to="/loans" className="hover:text-primary-foreground transition-colors">Loan Products</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Loan Types */}
          <div>
            <h4 className="font-semibold mb-4">Loan Types</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Personal Loans</li>
              <li>Business Loans</li>
              <li>Home Improvement</li>
              <li>Debt Consolidation</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@loanpap.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                
                +254757750349-LoanPap
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Nairobi Kenya -0001
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2026 LoanPap. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-primary-foreground/50">
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}