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

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-textSecondary text-sm">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-textSecondary">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and 
              ReTap S.r.l. ("ReTap," "we," "our," or "us") governing your use of our universal loyalty 
              card services, including our website, mobile applications, POS systems, and related services 
              (collectively, the "Service").
            </p>
            <p className="mb-4">
              By accessing or using our Service, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms. If you do not agree to these Terms, you must not use our Service. 
              These Terms apply to all users of the Service, including merchants, customers, and visitors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">2. Service Description</h2>
            <p className="mb-4">
              ReTap provides a comprehensive loyalty card platform that enables businesses to create, 
              manage, and operate customer loyalty programs. Our Service includes:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Universal NFC Cards:</strong> Physical and digital loyalty cards that work across all affiliated locations</li>
              <li><strong>Merchant Dashboard:</strong> Comprehensive management tools for customer data, transactions, and analytics</li>
              <li><strong>Point System:</strong> Customizable loyalty point accumulation and redemption mechanisms</li>
              <li><strong>Customer Portal:</strong> Web-based interface for customers to check balances and transaction history</li>
              <li><strong>POS Integration:</strong> Seamless integration with existing point-of-sale systems</li>
              <li><strong>Analytics & Reporting:</strong> Detailed insights into customer behavior and program performance</li>
              <li><strong>Technical Support:</strong> Ongoing assistance and maintenance services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">3. User Registration and Accounts</h2>
            
            <h3 className="text-xl font-semibold text-textPrimary mb-2">3.1 Merchant Accounts</h3>
            <p className="mb-4">
              To access merchant features, you must create an account and meet the following requirements:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Be a legally registered business entity with valid business credentials</li>
              <li>Provide accurate, complete, and current information during registration</li>
              <li>Maintain the security and confidentiality of your account credentials</li>
              <li>Promptly update account information when changes occur</li>
              <li>Accept responsibility for all activities conducted under your account</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            </ul>

            <h3 className="text-xl font-semibold text-textPrimary mb-2">3.2 Customer Accounts</h3>
            <p className="mb-4">
              Customers may use ReTap cards without registration, but account creation is required for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Online balance checking and transaction history</li>
              <li>Digital wallet integration (Apple Wallet, Google Wallet)</li>
              <li>Personalized offers and notifications</li>
              <li>Account management and preferences</li>
            </ul>
            <p className="mb-4">
              Customer account holders must be at least 16 years old and provide accurate information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">4. Payment Terms and Billing</h2>
            <p className="mb-4">
              Our pricing structure is designed to be transparent and scalable:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Monthly Subscription:</strong> €49/month + €99 one-time activation fee</li>
              <li><strong>Annual Subscription:</strong> €529/year (10% discount + no activation fee)</li>
              <li><strong>Payment Processing:</strong> All payments processed securely through Stripe</li>
              <li><strong>Billing Cycle:</strong> Recurring charges on the same date each month/year</li>
              <li><strong>Invoicing:</strong> Automatic invoice generation and delivery</li>
              <li><strong>Refund Policy:</strong> 30-day money-back guarantee for new subscriptions</li>
            </ul>
            <p className="mb-4">
              Prices are subject to change with 30 days' notice. Continued use after price changes 
              constitutes acceptance of new pricing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">5. Acceptable Use Policy</h2>
            <p className="mb-4">
              You agree to use our Service only for lawful purposes and in accordance with these Terms. 
              You are prohibited from:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Using the Service for any illegal or unauthorized purpose</li>
              <li>Violating any applicable laws, regulations, or third-party rights</li>
              <li>Attempting to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfering with or disrupting the Service or servers</li>
              <li>Engaging in fraudulent activities or misrepresentation</li>
              <li>Reverse engineering, decompiling, or disassembling our software</li>
              <li>Using automated systems to access the Service without permission</li>
              <li>Sharing account credentials or allowing unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">6. Intellectual Property Rights</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by ReTap and 
              are protected by international copyright, trademark, patent, trade secret, and other 
              intellectual property laws.
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Our Rights:</strong> We retain all rights, title, and interest in the Service</li>
              <li><strong>Your License:</strong> We grant you a limited, non-exclusive, non-transferable license to use the Service</li>
              <li><strong>Restrictions:</strong> You may not copy, modify, distribute, sell, or lease any part of our Service</li>
              <li><strong>User Content:</strong> You retain ownership of content you submit, but grant us license to use it</li>
              <li><strong>Trademarks:</strong> ReTap trademarks and logos may not be used without written permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">7. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed 
              by our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, 
              which is incorporated into these Terms by reference. By using our Service, you consent to 
              the collection and use of information as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">8. Service Availability and Maintenance</h2>
            <p className="mb-4">
              We strive to provide reliable service but cannot guarantee uninterrupted availability:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Uptime Target:</strong> We aim for 99.9% service availability</li>
              <li><strong>Scheduled Maintenance:</strong> We may perform maintenance with advance notice</li>
              <li><strong>Emergency Maintenance:</strong> Critical updates may be performed without notice</li>
              <li><strong>Force Majeure:</strong> We are not liable for service interruptions beyond our control</li>
              <li><strong>Updates:</strong> We may update the Service to improve functionality and security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, ReTap shall not be liable for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or technical failures</li>
              <li>Actions of third parties or affiliated merchants</li>
              <li>Security breaches or data loss</li>
              <li>Compatibility issues with third-party systems</li>
            </ul>
            <p className="mb-4">
              Our total liability to you for any claims arising from these Terms shall not exceed 
              the amount you paid for the Service in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">10. Warranties and Disclaimers</h2>
            <p className="mb-4">
              <strong>Service Warranty:</strong> We warrant that the Service will perform substantially 
              in accordance with its documentation under normal use.
            </p>
            <p className="mb-4">
              <strong>Disclaimer:</strong> EXCEPT AS EXPRESSLY PROVIDED, THE SERVICE IS PROVIDED "AS IS" 
              AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING 
              BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
              AND NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">11. Termination and Suspension</h2>
            <p className="mb-4">
              We may terminate or suspend your access to the Service immediately, without prior notice, 
              for any of the following reasons:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Violation of these Terms or applicable laws</li>
              <li>Fraudulent or abusive use of the Service</li>
              <li>Non-payment of fees or charges</li>
              <li>Request for account deletion</li>
              <li>Discontinuation of the Service</li>
              <li>Security concerns or threats</li>
            </ul>
            <p className="mb-4">
              Upon termination, your right to use the Service ceases immediately, and we may delete 
              your account and data in accordance with our data retention policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">12. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless ReTap and its officers, directors, 
              employees, and agents from and against any claims, damages, losses, liabilities, costs, 
              and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your violation of applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">13. Dispute Resolution</h2>
            <p className="mb-4">
              <strong>Governing Law:</strong> These Terms are governed by the laws of Italy, without 
              regard to conflict of law principles.
            </p>
            <p className="mb-4">
              <strong>Jurisdiction:</strong> Any disputes arising from these Terms shall be resolved 
              in the courts of Milan, Italy.
            </p>
            <p className="mb-4">
              <strong>Alternative Dispute Resolution:</strong> Before pursuing legal action, we encourage 
              parties to attempt resolution through good faith negotiations or mediation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">14. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material 
              changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Posting the updated Terms on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices within the Service</li>
            </ul>
            <p className="mb-4">
              Your continued use of the Service after such changes constitutes acceptance of the updated Terms. 
              If you do not agree to the changes, you must stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">15. General Provisions</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions remain in effect</li>
              <li><strong>Entire Agreement:</strong> These Terms constitute the complete agreement between the parties</li>
              <li><strong>Waiver:</strong> Failure to enforce any provision does not constitute a waiver</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our written consent</li>
              <li><strong>Survival:</strong> Sections 6, 7, 9, 11, 12, and 13 survive termination</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays due to circumstances beyond our control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">16. Contact Information</h2>
            <p className="mb-4">
              For questions about these Terms of Service or to exercise your rights, please contact us:
            </p>
            <div className="bg-surface p-6 rounded-lg border border-border">
              <p className="mb-2"><strong>ReTap S.r.l.</strong></p>
              <p className="mb-2">Email: info@retapcard.com</p>
              <p className="mb-2">WhatsApp: +39 380 2418839</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
} 