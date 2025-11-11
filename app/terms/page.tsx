"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

export default function TermsOfServicePage() {
  const { data: session } = useSession();
  const [siteName, setSiteName] = useState("");
  const isAdmin = !!(session as any)?.user?.isAdmin;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setSiteName(data.siteName);
        }
  } catch (error) {
        console.error('Error fetching settings:', error);
        setSiteName("AI Doctor Helper");
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                {siteName || "AI Doctor Helper"}
              </Link>
              {session && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Chat
                  </Link>
                  <Link href="/dashboard?section=profile" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Profile
                  </Link>
                  <Link href="/reports" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Reports
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                      Admin Panel
                    </Link>
                  )}
                </nav>
              )}
            </div>
            {session ? (
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </button>
            ) : (
              <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Terms of Use</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Effective date: August 1, 2025</p>
            
            <div className="space-y-8 text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed">
                Welcome to AI Doctor Helper (aidoctorhelper.com), a platform owned and operated by AI Doctor Helper, a company organized and existing under the laws of the State of Florida, with its principal business address at 3440 Hollywood Blvd. Suite 415, Hollywood, FL 33021, USA (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Use (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;you&quot;, &quot;your&quot;, or &quot;User&quot;) and AI Doctor Helper governing your access to and use of our website located at https://aidoctorhelper.com (the &quot;Site&quot;) and any services, applications, tools, content, and features made available through the Site (collectively, the &quot;Services&quot;).
              </p>
              
              <p className="text-lg leading-relaxed">
                By accessing or using our Services, you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not agree to these Terms, please do not use or access our Services.
              </p>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Eligibility and User Obligations</h2>
                <p className="leading-relaxed mb-4">
                  To use our Services, you must be at least 18 years old, or the age of legal majority in your jurisdiction. By using the Services, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>You are legally capable of entering into binding contracts;</li>
                  <li>You will comply with these Terms and all applicable laws and regulations;</li>
                  <li>You are using the Services solely for personal, non-commercial use unless expressly authorized.</li>
                </ul>
                <p className="leading-relaxed mb-4">
                  If you are using the Services on behalf of a company or legal entity, you represent that you have the authority to bind that entity to these Terms.
                </p>
                <p className="leading-relaxed mb-3">
                  You agree to use the Services only for their intended purpose and in accordance with all applicable laws, rules, and regulations. You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Services in any way that may infringe the rights of others or restrict or inhibit their use of the Services;</li>
                  <li>Attempt to gain unauthorized access to any part of the Services or any other systems or networks connected to the Services</li>
                  <li>Use bots, crawlers, or other automated methods to access the Services;</li>
                  <li>Transmit or upload viruses or other harmful code.</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Nature of the Services</h2>
                <p className="leading-relaxed mb-4">
                  AI Doctor Helper provides AI-powered health analysis tools that help users identify potential health conditions or concerns based on user-submitted information and images. These Services are intended solely for informational and educational purposes and are not a substitute for professional medical evaluation, diagnosis, or treatment.
                </p>
                <div className="bg-[#1e2541] border border-[#2a2f44] rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">Important Notice:</h3>
                  <p className="leading-relaxed">
                    The information provided through the Services is generated by artificial intelligence algorithms and is not reviewed or verified by licensed medical professionals. Always consult a licensed medical professional or dermatologist for clinical diagnosis or treatment decisions. Never disregard professional medical advice or delay seeking it because of information obtained through our Services.
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Account Registration and Security</h2>
                <p className="leading-relaxed mb-4">
                  To access certain features of the Services, you may be required to create an account. You agree to provide accurate, current, and complete information when registering and to update such information as needed. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
                <p className="leading-relaxed">
                  We reserve the right to suspend or terminate your access to the Services if we suspect that the information you provided is inaccurate or incomplete, or if you have violated these Terms.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Payments and Subscriptions</h2>
                <p className="leading-relaxed mb-4">
                  Some features of our Services may require payment, including but not limited to AI diagnostic reports, downloadable documentation, or subscriptions. By making a purchase, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Pay all applicable fees and taxes associated with your purchase;</li>
                  <li>Authorize us to charge your selected payment method;</li>
                  <li>Abide by the billing terms presented to you at the time of purchase.</li>
                </ul>
                <p className="leading-relaxed mb-4">
                  Plans may automatically renew unless you cancel them before the renewal date. You may cancel your subscription through your account settings or by contacting support at <a href="mailto:support@aidoctorhelper.com" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@aidoctorhelper.com</a>.
                </p>
                <p className="leading-relaxed">
                  We reserve the right to change pricing and payment terms at any time, provided that any such changes will not apply retroactively.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Intellectual Property Rights</h2>
                <p className="leading-relaxed mb-3">You may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Copy, reproduce, modify, adapt, publish, transmit, distribute, display, or otherwise exploit any content;</li>
                  <li>Reverse-engineer, disassemble, or decompile any part of the Service;</li>
                  <li>Use our trademarks or service marks without our prior written consent.</li>
                </ul>
                <p className="leading-relaxed">
                  You may use the Services only for personal, non-commercial purposes, unless you receive express written authorization from us.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Privacy and Data Security</h2>
                <p className="leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated by reference into these Terms.
                </p>
                <p className="leading-relaxed">
                  By using our Services, you consent to the collection, use, and disclosure of your personal information as described in our Privacy Policy. You acknowledge that data transmission over the internet is never 100% secure and we cannot guarantee the security of any information transmitted to or from the Site.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Third-Party Services and Links</h2>
                <p className="leading-relaxed mb-4">
                  Our Services may contain links to third-party websites or services that are not owned or controlled by us. We do not endorse, assume responsibility for, or have any control over the content, policies, or practices of any third-party websites or services.
                </p>
                <p className="leading-relaxed">
                  You acknowledge and agree that we are not responsible for any loss or damage caused by the use of any third-party websites or services.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Disclaimer of Warranties</h2>
                <p className="leading-relaxed mb-4">
                  To the maximum extent permitted by applicable law, the Services are provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement.
                </p>
                <p className="leading-relaxed mb-3">We do not warrant that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Services will be uninterrupted, timely, secure, or error-free;</li>
                  <li>The results obtained from using the Services will be accurate or reliable;</li>
                  <li>Any errors in the Services will be corrected.</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Limitation of Liability</h2>
                <p className="leading-relaxed mb-4">
                  To the fullest extent permitted by law, AI Doctor Helper shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses, resulting from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Your access to or use of, or inability to access or use, the Services;</li>
                  <li>Any conduct or content of any third party on the Services;</li>
                  <li>Any content obtained from the Services;</li>
                  <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                </ul>
                <p className="leading-relaxed">
                  This limitation applies even if we have been advised of the possibility of such damages.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Termination</h2>
                <p className="leading-relaxed mb-4">
                  We reserve the right, at our sole discretion, to terminate or suspend your access to the Services at any time and for any reason, including violation of these Terms or if we believe your actions may cause legal liability or harm to others.
                </p>
                <p className="leading-relaxed">
                  Upon termination, your right to use the Services will immediately cease. The following sections shall survive termination: Intellectual Property, Disclaimers, Limitation of Liability, Indemnification, and Governing Law.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Governing Law and Jurisdiction</h2>
                <p className="leading-relaxed mb-4">
                  These Terms shall be governed by principles of fair use and good faith. In the event of any dispute arising from your use of the Services, we encourage you to first contact us directly so we can work together in good faith to resolve the issue informally.
                </p>
                <p className="leading-relaxed">
                  If a formal resolution is required, both parties agree to seek a solution through appropriate and mutually acceptable channels, in accordance with applicable laws in the user&apos;s region or country of residence.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">12. Modifications to the Terms</h2>
                <p className="leading-relaxed mb-4">
                  We reserve the right to update or modify these Terms at any time without prior notice. Any changes will be effective immediately upon posting the revised Terms on the Site. Your continued use of the Services after the effective date constitutes your acceptance of the updated Terms.
                </p>
                <p className="leading-relaxed">
                  We encourage you to review these Terms periodically to stay informed.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">13. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions or concerns about these Terms or the Services, please contact us by e-mail at <a href="mailto:support@aidoctorhelper.com" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@aidoctorhelper.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 {siteName || "AI Doctor Helper"}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 