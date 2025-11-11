"use client";

import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { createClient } from '@supabase/supabase-js'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { useSession, signOut } from "next-auth/react"
import { PublicChat } from "@/components/PublicChat"

export default function LandingPage() {
  const { data: session } = useSession();
  const [siteName, setSiteName] = useState("AI Doctor");
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [heroTitle, setHeroTitle] = useState<string>("");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("");
  const [heroImage, setHeroImage] = useState<string>("");
  const [features, setFeatures] = useState<Array<{ id: string; title: string; description: string; icon?: string }>>([]);
  const [isReady, setIsReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  // Client-side Supabase for live reads
  const supabaseBrowser = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  ), []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, featuresFetch] = await Promise.all([
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/faq', { cache: 'no-store' }),
          fetch('/api/landing/features', { cache: 'no-store' }).catch(() => null),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.siteName) setSiteName(data.siteName);
        }

        if (faqRes.ok) {
          const items = await faqRes.json();
          setFaqs(Array.isArray(items) ? items : []);
        }

        // Fetch hero data from Supabase
        const { data: hero } = await supabaseBrowser
          .from('landing_hero')
          .select('title, subtitle, images')
          .eq('id', 1)
          .single();

        if (hero) {
          if (hero.title) setHeroTitle(hero.title);
          if (hero.subtitle) setHeroSubtitle(hero.subtitle);
          if (Array.isArray(hero.images) && hero.images.length > 0) {
            setHeroImage(hero.images[0]);
          }
        }

        // Fetch features
        if (featuresFetch && featuresFetch.ok) {
          const fd = await featuresFetch.json();
          if (Array.isArray(fd?.items)) {
            setFeatures(fd.items.map((it: any) => ({
              id: it.id,
              title: it.title,
              description: it.description || '',
              icon: it.icon
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching landing data:', error);
      } finally {
        setIsReady(true);
      }
    };
    fetchAll();
  }, [supabaseBrowser]);

  return (
    <div className="min-h-screen bg-[#f6faf9]">
      

      {/* Nav */}
      <nav className="nav">
        <div className="container">
          <Link href="/" className="brand">
            <span className="logo">AI</span>
            <span>{siteName || "AI Doctor"}</span>
          </Link>
          <div className="menu">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            {session ? (
              <>
                <Link href="/dashboard" className="btn">Go to Dashboard</Link>
                <button onClick={handleLogout} className="menu-link">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="menu-link">Sign In</Link>
                <Link href="#try" className="btn">Try Now</Link>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <button
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-[88px] z-30 bg-white border-b border-gray-200 p-4">
          <a href="#home" className="block py-2" onClick={() => setIsMenuOpen(false)}>Home</a>
          <a href="#features" className="block py-2" onClick={() => setIsMenuOpen(false)}>Features</a>
          <a href="#how" className="block py-2" onClick={() => setIsMenuOpen(false)}>How it works</a>
          <a href="#faq" className="block py-2" onClick={() => setIsMenuOpen(false)}>FAQ</a>
          {session ? (
            <>
              <Link href="/dashboard" className="block py-2" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block py-2 w-full text-left">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              <Link href="#try" className="block py-2" onClick={() => setIsMenuOpen(false)}>Try Now</Link>
            </>
          )}
        </div>
      )}

      {/* Hero */}
      <header id="home" className="hero relative isolation-isolate">
        <div className="bg absolute inset-0 -z-[2]" style={{
          backgroundImage: heroImage ? `url(${heroImage})` : "url('https://res.cloudinary.com/dqemas8ht/image/upload/v1762880186/robotdoctor_iewugh.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }} aria-hidden="true"></div>
        <div className="absolute inset-0 -z-[1]" style={{
          background: 'linear-gradient(90deg, rgba(15,23,42,.72) 10%, rgba(15,23,42,.35) 55%, rgba(15,23,42,.05) 100%)'
        }}></div>
        <div className="container grid lg:grid-cols-[1.1fr_0.9fr] gap-6 min-h-[72vh] items-center py-14">
          <div>
            <span className="kicker inline-block bg-white/10 text-[#e2e8f0] border border-white/25 px-2.5 py-1.5 rounded-full text-sm mb-4">
              You and <strong>your AI doctor</strong>
            </span>
            <h1 className="h1 text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] m-0 mb-3 text-white font-extrabold">
              {heroTitle || "Smart, private "}
              <span className="accent text-[#5ef2e7]">{heroTitle ? "" : "health answers"}</span>
              {heroTitle ? "" : " in seconds."}
            </h1>
            <p className="lead text-[#e2e8f0] text-lg max-w-[52ch]">
              {heroSubtitle || "Ask symptoms, medications, lab results, and get evidence‑linked insights. Available 24/7, designed for patients and caregivers. Not a substitute for professional medical advice."}
            </p>
            <div className="badges flex gap-4 mt-5 flex-wrap">
              <span className="badge flex items-center gap-2.5 bg-white text-[#0f172a] px-3 py-2.5 rounded-full shadow-[0_10px_30px_rgba(16,179,163,.12)] font-semibold">
                ✅ Regular Checkups
              </span>
              <span className="badge flex items-center gap-2.5 bg-white text-[#0f172a] px-3 py-2.5 rounded-full shadow-[0_10px_30px_rgba(16,179,163,.12)] font-semibold">
                🕒 Always Available
              </span>
              <span className="badge flex items-center gap-2.5 bg-white text-[#0f172a] px-3 py-2.5 rounded-full shadow-[0_10px_30px_rgba(16,179,163,.12)] font-semibold">
                🔒 Privacy‑First
              </span>
            </div>
            <div className="cta flex gap-3 mt-6 flex-wrap">
              <a href="#try" className="btn">⚡ Try Now</a>
              <a href="#features" className="btn ghost">Explore Features</a>
            </div>
          </div>
          <div className="stat-box grid grid-cols-2 gap-3.5 items-start">
            <div className="stat bg-white/90 border border-[#e2e8f0] rounded-2xl p-4 text-center shadow-[0_10px_30px_rgba(16,179,163,.12)]">
              <b className="text-2xl text-[#0b8f84] block">50k+</b>
              <small className="text-sm">Conversations</small>
            </div>
            <div className="stat bg-white/90 border border-[#e2e8f0] rounded-2xl p-4 text-center shadow-[0_10px_30px_rgba(16,179,163,.12)]">
              <b className="text-2xl text-[#0b8f84] block">92%</b>
              <small className="text-sm">User satisfaction</small>
            </div>
            <div className="stat bg-white/90 border border-[#e2e8f0] rounded-2xl p-4 text-center shadow-[0_10px_30px_rgba(16,179,163,.12)]">
              <b className="text-2xl text-[#0b8f84] block">24/7</b>
              <small className="text-sm">Availability</small>
            </div>
            <div className="stat bg-white/90 border border-[#e2e8f0] rounded-2xl p-4 text-center shadow-[0_10px_30px_rgba(16,179,163,.12)]">
              <b className="text-base text-[#0b8f84] block">HIPAA‑aware</b>
              <small className="text-sm">Best practices</small>
            </div>
          </div>
        </div>
      </header>

      {/* Feature row */}
      <div className="container feature-row grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12 relative z-10" id="features">
        {features.length > 0 ? features.slice(0, 4).map((feature) => (
          <article key={feature.id} className="card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <a href="#how" className="small inline-flex items-center gap-2 font-semibold text-[#0b8f84]">
              Read more →
            </a>
          </article>
        )) : (
          <>
            <article className="card">
              <h3>Professional staff</h3>
              <p>Built with medical advisors and reviewed prompts to improve clarity and safety.</p>
              <a href="#how" className="small inline-flex items-center gap-2 font-semibold text-[#0b8f84]">
                Read more →
              </a>
            </article>
            <article className="card">
              <h3>Affordable prices</h3>
              <p>Start free. Upgrade for unlimited chats, saved histories, and PDF export.</p>
              <a href="#pricing" className="small inline-flex items-center gap-2 font-semibold text-[#0b8f84]">
                View prices →
              </a>
            </article>
            <article className="card">
              <h3>Insurance partners</h3>
              <p>Bring your own plan. We integrate with major HSA/FSA payment providers.</p>
              <a href="#partners" className="small inline-flex items-center gap-2 font-semibold text-[#0b8f84]">
                See partners →
              </a>
            </article>
            <article className="card">
              <h3>Consult our doctors</h3>
              <p>Request a telehealth follow‑up with licensed clinicians in select regions.</p>
              <a href="#try" className="small inline-flex items-center gap-2 font-semibold text-[#0b8f84]">
                Choose a doctor →
              </a>
            </article>
          </>
        )}
      </div>

      {/* How it works */}
      <section id="how" className="py-18">
        <div className="container">
          <h2 className="text-4xl font-extrabold mb-3.5 m-0">How it works</h2>
          <p className="text-[#667085] max-w-[70ch] mb-6">
            Upload notes or lab results, type a question, and receive easy‑to‑read explanations with citations. Your data is encrypted in transit and at rest; you control what to save or delete.
          </p>
          <div className="grid-3 grid grid-cols-1 md:grid-cols-3 gap-6.5 mt-6">
            <div className="tile">
              <h3 className="text-xl font-semibold mb-2.5">1) Ask</h3>
              <p>Describe symptoms, medications, conditions, or share a PDF. The assistant clarifies before answering.</p>
            </div>
            <div className="tile">
              <h3 className="text-xl font-semibold mb-2.5">2) Understand</h3>
              <p>Get plain‑language guidance, differential considerations, and risk flags. Includes links to high‑quality sources.</p>
            </div>
            <div className="tile">
              <h3 className="text-xl font-semibold mb-2.5">3) Act</h3>
              <p>Receive next‑step options you can discuss with a clinician: monitoring tips, questions to ask, and care checklists.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Try Now CTA / Demo */}
      <section id="try" className="py-18 bg-gradient-to-b from-[#eefcfb] to-white">
        <div className="container">
          <div className="tile grid gap-4.5 items-center">
            <h2 className="text-3xl font-extrabold m-0">Try AI Doctor now</h2>
            <p className="m-0 text-[#667085]">Start a conversation with our AI health assistant below.</p>
            <div className="min-h-[400px]">
              <PublicChat chatTheme="light" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-18 bg-[#f6faf9]">
        <div className="container faq max-w-[900px] mx-auto">
          <h2 className="text-center text-4xl font-extrabold mb-2.5 m-0 text-[#101828]">Frequently Asked Questions</h2>
          <p className="text-center text-[#667085] mb-12 m-0 text-base">Quick answers about privacy, safety, and availability.</p>

          {faqs.length > 0 ? (
            <div className="space-y-3">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, idx) => (
                  <AccordionItem 
                    key={f.id} 
                    value={`item-${idx + 1}`} 
                    className="faq-item border-none mb-3"
                  >
                    <AccordionTrigger className="faq-trigger px-5 py-4.5 hover:no-underline">
                      <span className="faq-question text-left text-[#101828] font-semibold text-base">
                        {f.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="faq-content px-5 pb-4.5 pt-0">
                      <p className="text-[#667085] text-sm leading-relaxed">
                        {f.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="space-y-3">
              <details className="faq-item-details bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(16,179,163,.12)]" open>
                <summary className="faq-summary cursor-pointer list-none px-5 py-4.5 font-semibold flex items-center justify-between text-[#101828] text-base">
                  <span>Is this a medical diagnosis tool?</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-250 flex-shrink-0 ml-4">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </summary>
                <div className="faq-answer px-5 pb-4.5 text-[#667085] text-sm leading-relaxed">
                  No. AI Doctor offers educational guidance and question support. It is not a medical device and doesn't replace care from a qualified clinician. Always seek professional help for urgent concerns.
                </div>
              </details>
              <details className="faq-item-details bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(16,179,163,.12)]">
                <summary className="faq-summary cursor-pointer list-none px-5 py-4.5 font-semibold flex items-center justify-between text-[#101828] text-base">
                  <span>How do you protect my data?</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-250 flex-shrink-0 ml-4">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </summary>
                <div className="faq-answer px-5 pb-4.5 text-[#667085] text-sm leading-relaxed">
                  We use encryption in transit and at rest, strict access controls, and short retention by default. You can delete your conversations at any time.
                </div>
              </details>
              <details className="faq-item-details bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(16,179,163,.12)]">
                <summary className="faq-summary cursor-pointer list-none px-5 py-4.5 font-semibold flex items-center justify-between text-[#101828] text-base">
                  <span>Where do answers come from?</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-250 flex-shrink-0 ml-4">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </summary>
                <div className="faq-answer px-5 pb-4.5 text-[#667085] text-sm leading-relaxed">
                  Responses are generated by large language models guided by expert‑curated prompts and linked to reputable sources such as peer‑reviewed articles and clinical guidelines when available.
                </div>
              </details>
              <details className="faq-item-details bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(16,179,163,.12)]">
                <summary className="faq-summary cursor-pointer list-none px-5 py-4.5 font-semibold flex items-center justify-between text-[#101828] text-base">
                  <span>Can I talk to a human doctor?</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-250 flex-shrink-0 ml-4">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </summary>
                <div className="faq-answer px-5 pb-4.5 text-[#667085] text-sm leading-relaxed">
                  Yes—request a telehealth follow‑up after your session. Availability varies by state/country.
                </div>
              </details>
              <details className="faq-item-details bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(16,179,163,.12)]">
                <summary className="faq-summary cursor-pointer list-none px-5 py-4.5 font-semibold flex items-center justify-between text-[#101828] text-base">
                  <span>How much does it cost?</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-250 flex-shrink-0 ml-4">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </summary>
                <div className="faq-answer px-5 pb-4.5 text-[#667085] text-sm leading-relaxed">
                  You can try it free. Paid plans unlock unlimited chats, saved histories, email summaries, and priority support.
                </div>
              </details>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-[#cbd5e1]">
        <section className="container py-8">
          <div className="cols grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            <div>
              <div className="brand text-[#e2e8f0]">
                <span className="logo">AI</span>
                <span>{siteName || "AI Doctor"}</span>
              </div>
              <p className="text-[#9fb3c8] max-w-[52ch] mt-3">
                AI Doctor provides educational information only and does not diagnose, treat, or prescribe. In an emergency, call your local emergency number immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Company</h4>
              <div className="divider"></div>
              <a href="#" className="block text-[#9fb3c8] hover:text-white transition-colors">About</a>
              <a href="#" className="block text-[#9fb3c8] hover:text-white transition-colors">Careers</a>
              <a href="/contact" className="block text-[#9fb3c8] hover:text-white transition-colors">Contact</a>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Product</h4>
              <div className="divider"></div>
              <a href="#features" className="block text-[#9fb3c8] hover:text-white transition-colors">Features</a>
              <a href="#try" className="block text-[#9fb3c8] hover:text-white transition-colors">Try now</a>
              <a href="#faq" className="block text-[#9fb3c8] hover:text-white transition-colors">FAQ</a>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Legal</h4>
              <div className="divider"></div>
              <Link href="/terms" className="block text-[#9fb3c8] hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="block text-[#9fb3c8] hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
          <div className="copyright border-t border-white/20 mt-6 pt-4.5 text-center text-sm text-[#94a3b8]">
            © {new Date().getFullYear()} {siteName || "AI Doctor"}. All rights reserved.
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
        .hero {
          position: relative;
          isolation: isolate;
        }
        .kicker {
          display: inline-block;
          background: rgba(255,255,255,.1);
          color: #e2e8f0;
          border: 1px solid rgba(226,232,240,.25);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: .85rem;
          margin-bottom: 16px;
        }
        .badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          color: #0f172a;
          padding: 10px 12px;
          border-radius: 999px;
          box-shadow: 0 10px 30px rgba(16,179,163,.12);
          font-weight: 600;
        }
        .stat-box {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          align-items: start;
        }
        .stat {
          background: rgba(255,255,255,.9);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(16,179,163,.12);
        }
        .stat b {
          font-size: 1.6rem;
          color: var(--brand-dark);
        }
        .feature-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 48px;
        }
        /* FAQ Styling */
        .faq-item {
          background: #fff;
          border: 1px solid #e5e7eb !important;
          border-radius: 14px;
          margin-bottom: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(16,179,163,.12);
        }
        .faq-trigger {
          background: transparent !important;
          border: none !important;
          padding: 18px 20px !important;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .faq-trigger:hover {
          background: transparent !important;
        }
        .faq-question {
          flex: 1;
          text-align: left;
        }
        .faq-content {
          padding: 0 20px 18px !important;
        }
        .faq-item-details {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          margin-bottom: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(16,179,163,.12);
        }
        .faq-summary {
          cursor: pointer;
          list-style: none;
          padding: 18px 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .faq-summary::marker {
          display: none;
        }
        .faq-summary::-webkit-details-marker {
          display: none;
        }
        .faq-summary svg {
          transition: transform .25s ease;
          flex-shrink: 0;
          margin-left: 16px;
        }
        .faq-item-details[open] .faq-summary svg {
          transform: rotate(180deg);
        }
        .faq-answer {
          padding: 0 20px 18px;
          color: #667085;
          line-height: 1.7;
        }
        @media (max-width: 1000px) {
          .hero .container {
            grid-template-columns: 1fr;
          }
          .stat-box {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .feature-row {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .stat-box {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .feature-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
