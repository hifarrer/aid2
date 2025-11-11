"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Plan } from "@/lib/plans";
import Link from "next/link";
import SubscriptionModal from "@/components/SubscriptionModal";
import toast from "react-hot-toast";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function PlansPage() {
  const { data: session } = useSession();
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPlansList(data);
        } else {
          console.error('Failed to fetch plans');
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch('/api/faq', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setFaqs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };

    fetchFaqs();
  }, []);

  const handleSubscribe = (plan: Plan) => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    
    if (plan.title !== 'Free') {
      setSelectedPlan(plan);
      setIsSubscriptionModalOpen(true);
    } else {
      toast.success('Free plan activated!');
    }
  };

  const handleSubscriptionSuccess = () => {
    toast.success('Subscription successful! Welcome to your new plan.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6faf9]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#10b3a3]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf9]">
      {/* Top bar */}
      <div className="topbar">
        <div className="container">
          <div className="stack">
            <span className="pill">📅 Mon–Fri 08:00–19:00</span>
            <span className="pill">📍 27th Ave, New York, NY</span>
            <span className="pill">✉️ hello@aidoctor.ai</span>
            <span className="pill">☎️ +1 (800) 555‑0199</span>
          </div>
          <a href="/#try" className="pill">⚡ Try Now</a>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="container">
          <Link href="/" className="brand">
            <span className="logo">AI</span>
            <span>AI Doctor</span>
          </Link>
          <div className="menu">
            <a href="/#features">Features</a>
            <a href="/#how">How it works</a>
            <a href="/#faq">FAQ</a>
            <Link href="/plans">Pricing</Link>
            <Link href="/contact">Contact</Link>
            {session ? (
              <>
                <Link href="/dashboard" className="btn">Go to Dashboard</Link>
                <button onClick={handleLogout} className="menu-link">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="menu-link">Sign In</Link>
                <Link href="/#try" className="btn">Try Now</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-18">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="eyebrow text-[#667085] font-semibold tracking-wider uppercase text-xs mb-4">
            PRICING PLANS
          </div>
          <h1 className="text-5xl font-extrabold mb-4 text-[#101828]">
            Choose Your Plan
          </h1>
          <p className="text-lg text-[#667085] max-w-[600px] mx-auto">
            Get the perfect AI medical assistance plan for your needs. 
            Start with our free plan and upgrade as you grow.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1100px] mx-auto mb-20">
          {plansList.map((plan) => (
            <div
              key={plan.id}
              className={`card relative ${plan.isPopular ? 'border-[#10b3a3] border-2' : ''}`}
              style={{ 
                transform: plan.isPopular ? 'translateY(-4px)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#10b3a3] text-white px-4 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 className="text-2xl font-bold mb-2 text-[#101828]">
                  {plan.title}
                </h3>
                <p className="text-sm text-[#667085]">
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="text-5xl font-extrabold text-[#101828] mb-1">
                  ${plan.monthlyPrice}
                </div>
                <div className="text-base text-[#667085]">/month</div>
                <div className="text-sm text-[#667085] mt-2">
                  ${plan.yearlyPrice}/year
                  {plan.monthlyPrice > 0 && (
                    <span className="text-[#10b3a3] ml-2">
                      (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="list-none p-0 m-0 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 mb-3 text-[#101828]">
                    <CheckIcon className="w-5 h-5 text-[#10b3a3] flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              <div className="mt-6">
                {session ? (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={`btn w-full ${plan.isPopular ? '' : 'bg-white border-2 border-[#10b3a3] text-[#10b3a3] hover:bg-[#eefcfb]'}`}
                  >
                    {plan.title === 'Free' ? 'Get Started' : 'Subscribe Now'}
                  </button>
                ) : (
                  <Link href="/auth/login" className="block">
                    <button
                      className={`btn w-full ${plan.isPopular ? '' : 'bg-white border-2 border-[#10b3a3] text-[#10b3a3] hover:bg-[#eefcfb]'}`}
                    >
                      {plan.title === 'Free' ? 'Get Started' : 'Subscribe Now'}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="py-18 bg-gradient-to-b from-[#eefcfb] to-white">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div className="eyebrow text-[#667085] font-semibold tracking-wider uppercase text-xs mb-4">
                FAQ
              </div>
              <h2 className="text-4xl font-extrabold mb-4 text-[#101828]">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-[#667085] max-w-[600px] mx-auto">
                Have questions? We have answers.
              </p>
            </div>
            
            <div className="max-w-[800px] mx-auto">
              {faqs.length === 0 ? (
                <div className="text-center text-[#667085]">No FAQs yet.</div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((f, idx) => (
                    <AccordionItem key={f.id} value={`item-${idx + 1}`} className="qa">
                      <AccordionTrigger className="text-[#101828] text-base font-semibold">
                        {f.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#667085] text-sm leading-relaxed">
                        {f.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-18">
          <div className="container">
            <div className="tile text-center max-w-[600px] mx-auto">
              <h2 className="text-3xl font-extrabold mb-4 text-[#101828]">
                Ready to get started?
              </h2>
              <p className="text-lg text-[#667085] mb-8">
                Join thousands of users who trust our AI medical assistance platform.
              </p>
              {session ? (
                <Link href="/dashboard">
                  <button className="btn">
                    Go to Dashboard
                  </button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <button className="btn">
                    Get Started Free
                  </button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-[#cbd5e1]">
        <section className="container py-8">
          <div className="cols grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            <div>
              <div className="brand text-[#e2e8f0]">
                <span className="logo">AI</span>
                <span>AI Doctor</span>
              </div>
              <p className="text-[#9fb3c8] max-w-[52ch] mt-3">
                AI Doctor provides educational information only and does not diagnose, treat, or prescribe.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Company</h4>
              <div className="divider"></div>
              <a href="#" className="block text-[#9fb3c8] hover:text-white transition-colors">About</a>
              <a href="#" className="block text-[#9fb3c8] hover:text-white transition-colors">Careers</a>
              <Link href="/contact" className="block text-[#9fb3c8] hover:text-white transition-colors">Contact</Link>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Product</h4>
              <div className="divider"></div>
              <a href="/#features" className="block text-[#9fb3c8] hover:text-white transition-colors">Features</a>
              <a href="/#try" className="block text-[#9fb3c8] hover:text-white transition-colors">Try now</a>
              <a href="/#faq" className="block text-[#9fb3c8] hover:text-white transition-colors">FAQ</a>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Legal</h4>
              <div className="divider"></div>
              <Link href="/terms" className="block text-[#9fb3c8] hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="block text-[#9fb3c8] hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
          <div className="copyright border-t border-white/20 mt-6 pt-4.5 text-center text-sm text-[#94a3b8]">
            © {new Date().getFullYear()} AI Doctor. All rights reserved.
          </div>
        </section>
      </footer>

      {/* Subscription Modal */}
      {selectedPlan && (
        <SubscriptionModal
          plan={selectedPlan}
          isOpen={isSubscriptionModalOpen}
          onClose={() => {
            setIsSubscriptionModalOpen(false);
            setSelectedPlan(null);
          }}
          onSuccess={handleSubscriptionSuccess}
        />
      )}

      <style jsx>{`
        .menu-link {
          padding: 8px 10px;
          border-radius: 10px;
          color: #334155;
          font-weight: 500;
        }
        .menu-link:hover {
          background: #eefcfb;
          color: #0b8f84;
        }
      `}</style>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
