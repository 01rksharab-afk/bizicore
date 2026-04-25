import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Globe2,
  Loader2,
  Phone,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * PhoneLoginPage — now an informational redirect page.
 *
 * On the Internet Computer, phone numbers cannot create their own IC sessions.
 * Phone OTP is an account-linking feature that must be used after signing in
 * with Internet Identity. This page explains that and routes users appropriately.
 */
export function PhoneLoginPage() {
  const { isAuthenticated, isInitializing, login } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // If already authenticated, send them to profile settings to link their phone
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate({ to: "/settings/profile" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  async function handleIILogin() {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await login();
      // After login, useAuth + useOrgs will redirect appropriately in LoginPage.
      // Here we just send them to settings/profile to link their phone.
      navigate({ to: "/settings/profile" });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Login failed. Please try again.";
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      data-ocid="phone-login-page"
    >
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-8 flex items-center gap-4 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to login"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-display font-bold text-xs">
              B
            </span>
          </div>
          <span className="font-display font-semibold text-foreground">
            BizCore
          </span>
        </div>
      </header>

      {/* Main card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-background/60 space-y-6"
          >
            {/* Icon */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Phone Verification
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Phone numbers are linked to your Internet Identity account — not
                used as a standalone sign-in method.
              </p>
            </div>

            {/* How it works */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-muted/40 border border-border px-4 py-3">
                <div className="size-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-foreground font-bold text-xs">
                    1
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sign in with Internet Identity
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your secure, passwordless IC identity
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-muted/40 border border-border px-4 py-3">
                <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-muted-foreground font-bold text-xs">
                    2
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Link your phone in Profile Settings
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go to Profile → Connected Accounts to add phone verification
                  </p>
                </div>
              </div>
            </div>

            {/* Why this way */}
            <div className="flex items-start gap-2.5 bg-accent/5 border border-accent/15 rounded-xl px-4 py-3">
              <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                On the Internet Computer, all sessions are principal-based and
                require Internet Identity. Google and Phone are additional
                verification methods you can link for convenience.
              </p>
            </div>

            {loginError && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {loginError}
              </p>
            )}

            {/* CTA */}
            <div className="space-y-3">
              <Button
                className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md shadow-accent/20 gap-2"
                onClick={handleIILogin}
                disabled={isLoggingIn}
                data-ocid="phone-page-ii-login-btn"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Globe2 className="w-4 h-4" />
                    Sign in with Internet Identity
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Back to all sign-in options
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} BizCore. Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
