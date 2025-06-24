"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getInboxUrl, isEmailTestingAvailable } from "@/lib/email-config";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if user is already logged in and verified
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email_confirmed_at) {
        router.push('/dashboard/tutorial');
      }
    };
    checkUser();

    // Extract email from URL parameters if present
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [router, supabase.auth, searchParams]);

  const handleResendEmail = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      setMessage("Verification email sent successfully! Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending email");
    } finally {
      setLoading(false);
    }
  };

  // Development helper: simulate email verification
  const handleSimulateVerification = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Get current session to check if user exists
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError("No user session found. Please sign up first.");
        return;
      }

      // In development, we can manually confirm the user
      // This is only for testing purposes
      const { error } = await supabase.auth.updateUser({
        data: { email_confirmed: true }
      });

      if (error) {
        throw error;
      }

      setMessage("Email verification simulated successfully! Redirecting to onboarding...");
      
      // Redirect to onboarding after a short delay
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error simulating verification");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-textSecondary">
            We've sent a confirmation link to your email. Click the link to activate your account.
          </p>
        </div>

        {error && (
          <div className="bg-[#FF3131]/10 text-[#FF3131] text-sm p-4 rounded-lg flex items-center gap-2 border border-[#FF3131]/20">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 text-green-500 text-sm p-4 rounded-lg flex items-center gap-2 border border-green-500/20">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-[#FF3131]/20 focus:border-[#FF3131] transition-all"
            />
          </div>

          <Button
            onClick={handleResendEmail}
            className="w-full h-12 bg-[#1A1A1A] hover:bg-[#FF3131] text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            disabled={loading || !email}
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Resend verification email
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>

          {/* Development helper - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={handleSimulateVerification}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  🧪 Simulate Email Verification (Dev Only)
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          )}
        </div>

        <div className="text-center text-sm space-y-2">
          <p className="text-textSecondary">
            Didn't receive the email? Check your spam folder too.
          </p>
          
          {/* Development information */}
          {isEmailTestingAvailable() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-blue-800 text-xs font-medium mb-2">
                🧪 Development Mode - Email Testing
              </p>
              <p className="text-blue-700 text-xs mb-2">
                Since you're in development mode, emails are sent to a local testing server.
              </p>
              <a
                href={getInboxUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Open Email Testing Interface
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          
          <Link 
            href="/auth" 
            className="text-[#1A1A1A] hover:text-[#FF3131] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
} 