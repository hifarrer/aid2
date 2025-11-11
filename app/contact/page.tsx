"use client";

import React, { useState } from 'react';
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim() || !email.trim() || !message.trim()) {
        toast.error("Please fill out all fields.");
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, message }),
        });

        const result = await response.json();

        if (response.ok) {
            toast.success('Message sent successfully!');
            setName('');
            setEmail('');
            setMessage('');
        } else {
            toast.error(result.error || 'Failed to send message.');
        }
    } catch (error) {
        toast.error('An unexpected error occurred.');
        console.error("Fetch error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf9]">
      <Toaster position="top-center" />
      
      

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
            GET IN TOUCH
          </div>
          <h1 className="text-5xl font-extrabold mb-4 text-[#101828]">
            Contact Us
          </h1>
          <p className="text-lg text-[#667085] max-w-[600px] mx-auto">
            Have a question or feedback? Fill out the form below to get in touch with our team.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-[600px] mx-auto">
          <form onSubmit={handleSubmit} className="card">
            <div className="form-group mb-6">
              <label className="form-label block text-[#101828] font-semibold mb-2 text-sm" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="form-input w-full px-4 py-4 bg-white border border-[#e5e7eb] rounded-xl text-[#101828] text-base transition-all focus:outline-none focus:border-[#10b3a3] focus:ring-2 focus:ring-[#10b3a3]/20"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group mb-6">
              <label className="form-label block text-[#101828] font-semibold mb-2 text-sm" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input w-full px-4 py-4 bg-white border border-[#e5e7eb] rounded-xl text-[#101828] text-base transition-all focus:outline-none focus:border-[#10b3a3] focus:ring-2 focus:ring-[#10b3a3]/20"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group mb-6">
              <label className="form-label block text-[#101828] font-semibold mb-2 text-sm" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                className="form-input form-textarea w-full px-4 py-4 bg-white border border-[#e5e7eb] rounded-xl text-[#101828] text-base transition-all focus:outline-none focus:border-[#10b3a3] focus:ring-2 focus:ring-[#10b3a3]/20 min-h-[150px] resize-y"
                placeholder="Enter your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <section className="py-18 mt-20">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="eyebrow text-[#667085] font-semibold tracking-wider uppercase text-xs mb-4">
              WAYS TO REACH US
            </div>
            <h2 className="text-4xl font-extrabold mb-4 text-[#101828]">
              Other Ways to Connect
            </h2>
            <p className="text-lg text-[#667085] max-w-[600px] mx-auto">
              Prefer a different way to get in touch? We&apos;re here to help.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
            <div className="tile text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#10b3a3] rounded-xl flex items-center justify-center text-2xl">
                📧
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#101828]">Email Support</h3>
              <p className="text-[#667085] leading-relaxed">
                Send us an email at contact@aidoctorhelper.com and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
            
            <div className="tile text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#10b3a3] rounded-xl flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#101828]">Live Chat</h3>
              <p className="text-[#667085] leading-relaxed">
                Chat with our AI assistant 24/7 for instant help with your questions and concerns.
              </p>
            </div>
            
            <div className="tile text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#10b3a3] rounded-xl flex items-center justify-center text-2xl">
                📖
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#101828]">Help Center</h3>
              <p className="text-[#667085] leading-relaxed">
                Browse our comprehensive knowledge base for answers to common questions.
              </p>
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
        .form-input::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
