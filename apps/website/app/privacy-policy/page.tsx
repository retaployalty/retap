"use client";
import { Navbar } from "../components/Navbar";
import { Fredoka } from "next/font/google";
import Link from "next/link";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-fredoka",
  display: "swap"
});

export default function PrivacyPolicy() {
  return (
    <main className={fredoka.className + " antialiased bg-background min-h-screen"}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-24 sm:py-28 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-textPrimary mb-4">
            Privacy Policy
          </h1>
          <p className="text-textSecondary text-sm">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-textSecondary">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">1. Introduction</h2>
            <p className="mb-4">
              ReTap S.r.l. ("ReTap," "we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our universal loyalty card services, including our website, mobile applications, 
              and related services (collectively, the "Service").
            </p>
            <p className="mb-4">
              By using our Service, you consent to the data practices described in this Privacy Policy. 
              If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-textPrimary mb-2">2.1 Personal Information You Provide</h3>
            <p className="mb-4">We may collect the following personal information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, business information (for merchants)</li>
              <li><strong>Card Information:</strong> NFC card UID, card activation data</li>
              <li><strong>Profile Information:</strong> Preferences, settings, and account configurations</li>
              <li><strong>Communication Data:</strong> Messages, support requests, and feedback</li>
            </ul>

            <h3 className="text-xl font-semibold text-textPrimary mb-2">2.2 Automatically Collected Information</h3>
            <p className="mb-4">We automatically collect certain information when you use our Service:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Transaction history, points earned/redeemed, card usage patterns</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
              <li><strong>Location Data:</strong> Geographic location (with your consent)</li>
              <li><strong>Log Data:</strong> Access times, pages viewed, features used</li>
              <li><strong>Analytics Data:</strong> Service performance, error reports, usage statistics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our loyalty card services</li>
              <li><strong>Transaction Processing:</strong> To process card transactions, manage points, and handle rewards</li>
              <li><strong>Account Management:</strong> To create and manage your account, verify your identity</li>
              <li><strong>Communication:</strong> To send you service updates, support messages, and marketing communications (with consent)</li>
              <li><strong>Analytics:</strong> To analyze usage patterns, improve user experience, and develop new features</li>
              <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">4. Information Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, rent, or trade your personal information to third parties. 
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              <li><strong>Affiliated Merchants:</strong> With participating merchants to process transactions and manage loyalty programs (limited to necessary data only)</li>
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating our Service (under strict confidentiality agreements)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with appropriate safeguards)</li>
              <li><strong>Safety and Security:</strong> To protect our rights, property, or safety, or that of our users or the public</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement comprehensive security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
              <li><strong>Access Controls:</strong> Strict authentication and authorization procedures for data access</li>
              <li><strong>Network Security:</strong> Firewalls, intrusion detection, and regular security audits</li>
              <li><strong>Data Backup:</strong> Regular, secure backups with disaster recovery procedures</li>
              <li><strong>Employee Training:</strong> Regular security training for all employees with access to personal data</li>
              <li><strong>Incident Response:</strong> Established procedures for responding to security incidents</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">6. Your Rights and Choices</h2>
            <p className="mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us using the information provided below. 
              We will respond to your request within 30 days, unless additional time is required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information only for as long as necessary to fulfill the purposes 
              outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. 
              Specific retention periods include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active and for 7 years after deactivation</li>
              <li><strong>Transaction Data:</strong> Retained for 10 years for tax and regulatory compliance</li>
              <li><strong>Log Data:</strong> Retained for 2 years for security and troubleshooting</li>
              <li><strong>Marketing Data:</strong> Retained until you opt out or for 3 years after last interaction</li>
            </ul>
            <p className="mb-4">
              When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, 
              and provide personalized content. These technologies include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for basic service functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Service</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing Cookies:</strong> Deliver relevant advertisements (with consent)</li>
            </ul>
            <p className="mb-4">
              You can control cookie settings through your browser preferences. 
              However, disabling certain cookies may affect service functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">9. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. 
              We ensure that such transfers comply with applicable data protection laws through:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Adequacy decisions by relevant authorities</li>
              <li>Standard contractual clauses approved by regulatory bodies</li>
              <li>Other appropriate safeguards as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">10. Children's Privacy</h2>
            <p className="mb-4">
              Our Service is not intended for children under 16 years of age. We do not knowingly collect 
              personal information from children under 16. If you are a parent or guardian and believe 
              your child has provided us with personal information, please contact us immediately. 
              We will take steps to remove such information from our records.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">11. Third-Party Services</h2>
            <p className="mb-4">
              Our Service may contain links to third-party websites or integrate with third-party services. 
              We are not responsible for the privacy practices of these third parties. 
              We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">12. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Sending you an email notification</li>
              <li>Displaying a prominent notice in our Service</li>
            </ul>
            <p className="mb-4">
              Your continued use of our Service after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-surface p-6 rounded-lg border border-border">
              <p className="mb-2"><strong>ReTap S.r.l.</strong></p>
              <p className="mb-2">Email: info@retapcard.com</p>
              <p className="mb-2">WhatsApp: +39 380 2418839</p>
            </div>
            <p className="mt-4 text-sm text-textSecondary">
              For EU residents: You also have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
} 