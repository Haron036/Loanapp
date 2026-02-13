import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Icons
import {
  Shield,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Target,
  Heart,
  Lightbulb,
  Plus,
  Minus,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";

// Images - Using your latest profile_pic settings
import aronImg from "../assets/profile_pic.jpeg";
import JimmyImg from "../assets/Jimmy.jpeg";
import haronImg from "../assets/profile_pic.jpeg";
import emilioImg from "../assets/Emilio.jpeg";

const stats = [
  { value: "Ksh 250M+", label: "Loans Funded" },
  { value: "15,000+", label: "Happy Customers" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24hrs", label: "Avg. Approval" },
];

const team = [
  { name: "Aron Ngetich", role: "CEO & Founder", image: haronImg },
  {
    name: "Emilio Ngetich",
    role: "Chief Technology Officer",
    image: emilioImg,
  },
  { name: "Jimmy", role: "Head of Credit", image: JimmyImg },
  { name: "Haron", role: "Chief Operations Officer", image: aronImg },
];

const faqs = [
  {
    question: "How does LoanPap evaluate credit?",
    answer:
      "We use a proprietary rule-based scoring engine that looks at multiple data points including income stability and transaction history, ensuring fair assessment for everyone.",
  },
  {
    question: "Are there any hidden fees?",
    answer:
      "None. We pride ourselves on radical transparency. All interest rates and processing fees are shown upfront before you commit.",
  },
  {
    question: "How quickly can I get my funds?",
    answer:
      "Once approved, funds are typically dispatched to your account within minutes, depending on your banking provider.",
  },
];

export default function About() {
  const navigate = useNavigate();
  const teamRef = useRef(null); // Ref for scrolling to team
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Smooth scroll handler
  const scrollToTeam = () => {
    teamRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsContactOpen(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/10">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative bg-hero pt-32 pb-24 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 tracking-tight">
              Reimagining <span className="text-secondary">Lending</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed mb-10">
              We're on a mission to make financial services accessible,
              transparent, and fair for everyone in the modern world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg group bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={scrollToTeam}
              >
                Meet the Team
                <Users className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg group bg-secondary text-secondary-foreground hover:bg-secondary/90 "
                onClick={() => navigate("/auth?mode=register")}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-16 -mt-12 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-xl">
                  <CardContent className="pt-8 pb-8 text-center">
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STORY & ICON GRID --- */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl font-bold tracking-tight">Our Story</h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  LoanPap was founded in 2026 with a simple belief: everyone
                  deserves access to fair, transparent lending.
                </p>
                <p>
                  We built a platform that combines{" "}
                  <strong>cutting-edge technology</strong> with human
                  understanding to evaluate applicants fairly based on their
                  true potential.
                </p>
              </div>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg group"
                onClick={() => navigate("/auth?mode=register")}
              >
                Join Our Community
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
                { icon: Award, color: "bg-purple-50 text-purple-600" },
                { icon: Users, color: "bg-orange-50 text-orange-600" },
                { icon: Shield, color: "bg-green-50 text-green-600" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`aspect-square rounded-3xl ${item.color} flex items-center justify-center shadow-sm`}
                >
                  <item.icon size={48} strokeWidth={1.5} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TEAM SECTION (Scroll Target) --- */}
      <section ref={teamRef} className="py-24 bg-muted/30 scroll-mt-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Leadership Team
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet the visionaries making fair credit a reality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
                    <img
                      src={member.image}
                      alt={member.name}
                      className="relative w-48 h-48 rounded-full object-cover border-4 border-background shadow-xl z-10 transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mt-1">
                    {member.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Common Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border rounded-2xl bg-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-muted/30 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  {activeFaq === i ? (
                    <Minus size={20} className="text-primary" />
                  ) : (
                    <Plus size={20} />
                  )}
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-muted-foreground leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT CTA --- */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Still have questions?
          </h2>
          <p className="mb-10 text-primary-foreground/80 max-w-xl mx-auto">
            Our team is ready to help you navigate your financial journey 24/7.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full px-10 shadow-lg"
            onClick={() => setIsContactOpen(true)}
          >
            Contact Support
          </Button>
        </div>
      </section>

      {/* --- CONTACT MODAL --- */}
      <AnimatePresence>
        {isContactOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-card rounded-[2rem] shadow-2xl p-8 overflow-hidden"
            >
              <button
                onClick={() => setIsContactOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2
                    size={48}
                    className="text-green-500 mx-auto mb-4"
                  />
                  <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">
                    We'll get back to you shortly.
                  </p>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-6">Get in touch</h3>
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <input
                      required
                      className="w-full p-4 rounded-xl border bg-background"
                      placeholder="Your Name"
                    />
                    <input
                      required
                      type="email"
                      className="w-full p-4 rounded-xl border bg-background"
                      placeholder="Email Address"
                    />
                    <textarea
                      required
                      className="w-full p-4 rounded-xl border bg-background h-32"
                      placeholder="How can we help?"
                    />
                    <Button
                      type="submit"
                      className="w-full py-6 rounded-xl text-lg font-semibold"
                    >
                      Send Message
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
