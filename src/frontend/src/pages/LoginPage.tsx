import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useOrgs } from "@/hooks/useOrg";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronRight,
  Globe2,
  Loader2,
  Phone,
  Shield,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

// ─── Google Icon SVG ──────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Auth Card ────────────────────────────────────────────────────────────────
interface AuthCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: React.ReactNode;
  onCta: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  "data-ocid"?: string;
  accent?: boolean;
}

function AuthCard({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  isLoading,
  disabled,
  "data-ocid": ocid,
  accent,
}: AuthCardProps) {
  return (
    <Card
      className={`relative h-full flex flex-col transition-all duration-300 cursor-default group
        ${
          accent
            ? "bg-card border-accent/50 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
            : "bg-card border-border hover:border-accent/30"
        }`}
    >
      {accent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
            Recommended
          </span>
        </div>
      )}
      <CardContent className="p-6 flex flex-col gap-5 flex-1">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center
          ${accent ? "bg-accent/15 border border-accent/30" : "bg-muted border border-border"}`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground text-lg mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* CTA */}
        <Button
          className={`w-full h-11 font-semibold transition-smooth ${
            accent
              ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-md shadow-accent/20"
              : ""
          }`}
          variant={accent ? "default" : "outline"}
          onClick={onCta}
          disabled={disabled || isLoading}
          data-ocid={ocid}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting…
            </span>
          ) : (
            ctaLabel
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Feature Pills ────────────────────────────────────────────────────────────
const featurePills = [
  "CRM & Pipeline",
  "GST Filing",
  "Invoicing",
  "Inventory",
  "ERP",
  "HR Portal",
  "B2B Portals",
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function LoginPage() {
  const { isAuthenticated, isInitializing, login, loginError } = useAuth();
  const { data: orgs, isLoading: orgsLoading, isError: orgsError } = useOrgs();
  const navigate = useNavigate();
  const { error: googleError } = useGoogleAuth();
  const [isIILoading, setIsIILoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Once authenticated, wait for orgs to load before navigating
  useEffect(() => {
    if (!isAuthenticated || orgsLoading) return;
    if (orgsError) return;
    if (orgs && orgs.length > 0) {
      navigate({ to: "/orgs/select" });
    } else if (orgs && orgs.length === 0) {
      navigate({ to: "/orgs/new" });
    }
  }, [isAuthenticated, orgs, orgsLoading, orgsError, navigate]);

  // Full-screen loader while II is initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Loading while fetching orgs post-auth
  if (isAuthenticated && orgsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm">Loading your workspaces…</p>
        </div>
      </div>
    );
  }

  async function handleIILogin() {
    setLocalError(null);
    setIsIILoading(true);
    try {
      await login();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Login failed. Please try again.";
      setLocalError(msg);
    } finally {
      setIsIILoading(false);
    }
  }

  const displayError = localError ?? loginError ?? googleError;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      data-ocid="login-page"
    >
      {/* ── Background Glow ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/6 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/4 rounded-full blur-3xl" />
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="relative z-10 px-6 pt-8 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <span className="text-accent-foreground font-display font-bold text-base">
              B
            </span>
          </div>
          <span className="font-display font-bold text-foreground text-xl tracking-tight">
            BizCore
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-accent" />
          <span>Secured by Internet Computer</span>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl mx-auto">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                Complete B2B Business Platform
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.05] tracking-tight mb-5">
              Unified Business
              <br />
              <span className="text-accent">Platform</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              CRM, Finance, Accounting — and 15 more modules — all in one place,
              designed for modern Indian businesses.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {featurePills.map((pill) => (
                <span
                  key={pill}
                  className="text-xs px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium"
                >
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Error banner */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center gap-3 bg-destructive/10 border border-destructive/25 rounded-xl px-4 py-3 max-w-xl mx-auto"
            >
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{displayError}</p>
            </motion.div>
          )}

          {/* ── Auth Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {/* Internet Identity — primary */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full"
            >
              <AuthCard
                icon={<Globe2 className="w-6 h-6 text-accent" />}
                title="Internet Identity"
                description="Secure, passwordless sign-in with your Internet Computer identity. No passwords or personal data required."
                ctaLabel={
                  <span className="flex items-center gap-2">
                    Sign in with Internet Identity
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                }
                onCta={handleIILogin}
                isLoading={isIILoading}
                accent
                data-ocid="ii-login-btn"
              />
            </motion.div>

            {/* Google — link after sign in */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full"
            >
              <AuthCard
                icon={<GoogleIcon className="w-6 h-6" />}
                title="Google Account"
                description="Sign in with Internet Identity first, then link your Google account in Profile Settings for quick access."
                ctaLabel={
                  <span className="flex items-center gap-2">
                    Sign in first to link Google
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                }
                onCta={handleIILogin}
                isLoading={isIILoading}
                data-ocid="google-login-btn"
              />
            </motion.div>

            {/* Phone — link after sign in */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full"
            >
              <AuthCard
                icon={<Phone className="w-6 h-6 text-muted-foreground" />}
                title="Phone Number"
                description="Sign in with Internet Identity first, then link your phone number in Profile Settings for SMS verification."
                ctaLabel={
                  <span className="flex items-center gap-2">
                    Sign in first to link Phone
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                }
                onCta={handleIILogin}
                data-ocid="phone-login-btn"
              />
            </motion.div>
          </div>

          {/* Info note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 max-w-xl mx-auto"
          >
            <div className="flex items-start gap-3 bg-accent/5 border border-accent/15 rounded-xl px-4 py-3.5">
              <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">
                  How authentication works on BizCore:
                </span>{" "}
                Sign in with Internet Identity — your secure, passwordless IC
                identity. Once signed in, connect Google or Phone in your
                Profile Settings for added convenience.
              </p>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </motion.div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-6 text-center">
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
