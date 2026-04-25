import {
  type OrgAddress,
  type OrgContactPerson,
  OrgType,
  PlanTier,
} from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
  Loader2,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];

const TOTAL_STEPS = 6;

const STEP_LABELS = ["Type", "Details", "Address", "Contact", "Plan", "Review"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

function validateGstin(gstin: string): string | null {
  if (!gstin) return null;
  if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
  ) {
    return "Invalid GSTIN — must be 15 characters (e.g. 22AAAAA0000A1Z5)";
  }
  return null;
}

function validatePan(pan: string): string | null {
  if (!pan) return null;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return "Invalid PAN — must be 10 characters (e.g. ABCDE1234F)";
  }
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone) return "Phone number is required";
  if (!/^\d{10}$/.test(phone)) return "Enter a valid 10-digit mobile number";
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
  orgType: OrgType | null;
}
interface Step2Data {
  name: string;
  slug: string;
  slugTouched: boolean;
  gstin: string;
  pan: string;
  timezone: string;
}
interface Step3Data {
  street: string;
  city: string;
  state: string;
  postal: string;
  country: string;
}
interface Step4Data {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  skip: boolean;
}
interface Step5Data {
  plan: PlanTier;
}

// ─── StepProgress ─────────────────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">
          Step {current} of {total}
        </span>
        <span className="text-xs text-accent font-medium">
          {STEP_LABELS[current - 1]}
        </span>
      </div>
      <div className="flex gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full transition-smooth ${
              i < current ? "bg-accent" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-medium transition-smooth ${
              i + 1 === current
                ? "text-accent"
                : i + 1 < current
                  ? "text-muted-foreground"
                  : "text-muted-foreground/40"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreateOrgPage() {
  const { actor } = useBackendActor();
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [step1, setStep1] = useState<Step1Data>({ orgType: null });
  const [step2, setStep2] = useState<Step2Data>({
    name: "",
    slug: "",
    slugTouched: false,
    gstin: "",
    pan: "",
    timezone: "Asia/Kolkata",
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [step3, setStep3] = useState<Step3Data>({
    street: "",
    city: "",
    state: "",
    postal: "",
    country: "India",
  });
  const [step4, setStep4] = useState<Step4Data>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    skip: false,
  });
  const [step5, setStep5] = useState<Step5Data>({ plan: PlanTier.free });

  const [touched2, setTouched2] = useState(false);
  const [touched3, setTouched3] = useState(false);
  const [touched4, setTouched4] = useState(false);

  // ── Auth guard — redirect unauthenticated users to /login ─────────────────
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  // ── Slug auto-gen ──────────────────────────────────────────────────────────
  const { name: orgName, slugTouched } = step2;
  useEffect(() => {
    if (!slugTouched) {
      setStep2((p) => ({ ...p, slug: slugify(orgName) }));
    }
  }, [orgName, slugTouched]);

  const checkSlug = useCallback(
    async (value: string) => {
      if (!actor || !value || value.length < 2) {
        setSlugAvailable(null);
        return;
      }
      setCheckingSlug(true);
      try {
        const available = await actor.isSlugAvailable(value);
        setSlugAvailable(available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (!step2.slug) {
      setSlugAvailable(null);
      return;
    }
    const t = setTimeout(() => checkSlug(step2.slug), 500);
    return () => clearTimeout(t);
  }, [step2.slug, checkSlug]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const slugValid = /^[a-z0-9-]{2,48}$/.test(step2.slug);

  const gstinError = touched2
    ? step1.orgType === OrgType.company && !step2.gstin
      ? "GSTIN is required for companies"
      : validateGstin(step2.gstin)
    : null;

  const panError = touched2 ? validatePan(step2.pan) : null;

  const step2Valid =
    step2.name.trim().length >= 2 &&
    slugValid &&
    slugAvailable === true &&
    !gstinError &&
    !panError;

  const step3Valid =
    step3.street.trim().length >= 2 &&
    step3.city.trim().length >= 1 &&
    step3.state.length > 0 &&
    /^\d{6}$/.test(step3.postal);

  const step4Valid =
    step4.skip ||
    (step4.firstName.trim().length >= 1 &&
      step4.lastName.trim().length >= 1 &&
      !validatePhone(step4.phone) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step4.email));

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goNext() {
    if (step === 2) {
      setTouched2(true);
      if (!step2Valid) return;
    }
    if (step === 3) {
      setTouched3(true);
      if (!step3Valid) return;
    }
    if (step === 4) {
      setTouched4(true);
      if (!step4Valid) return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const createOrg = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      if (!step1.orgType) throw new Error("Select organization type");

      const address: OrgAddress = {
        street: step3.street.trim(),
        city: step3.city.trim(),
        state: step3.state,
        postal: step3.postal.trim(),
        country: step3.country.trim(),
      };

      const contactPerson: OrgContactPerson | null = step4.skip
        ? null
        : {
            name: `${step4.firstName.trim()} ${step4.lastName.trim()}`,
            phone: `+91${step4.phone.trim()}`,
            email: step4.email.trim(),
          };

      return actor.createOrg(
        step2.name.trim(),
        step2.slug,
        step2.timezone,
        step1.orgType,
        step2.gstin.trim() || null,
        step2.pan.trim() || null,
        address,
        contactPerson,
      );
    },
    onSuccess: async (orgId) => {
      // Upgrade plan if not free
      if (step5.plan !== PlanTier.free && actor && orgId) {
        try {
          await actor.changePlan(orgId, step5.plan);
        } catch {
          // Non-fatal — org is created, plan upgrade can be done later
          toast.warning("Organization created. Update your plan in Settings.");
        }
      }
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Organization created successfully!");
      navigate({ to: "/orgs/select" });
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to create organization");
    },
  });

  // ── Animation ──────────────────────────────────────────────────────────────
  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  // Show loader while II initializes or user is not authenticated yet
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-6"
      data-ocid="create-org-page"
    >
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-display font-bold text-sm">
              B
            </span>
          </div>
          <span className="font-display font-semibold text-foreground text-lg">
            BizCore
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <StepProgress current={step} total={TOTAL_STEPS} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {step === 1 && (
                <Step1
                  data={step1}
                  onChange={setStep1}
                  onNext={() => {
                    setDirection(1);
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && (
                <Step2
                  data={step2}
                  onChange={setStep2}
                  orgType={step1.orgType}
                  slugAvailable={slugAvailable}
                  checkingSlug={checkingSlug}
                  slugValid={slugValid}
                  gstinError={gstinError}
                  panError={panError}
                  touched={touched2}
                />
              )}
              {step === 3 && (
                <Step3 data={step3} onChange={setStep3} touched={touched3} />
              )}
              {step === 4 && (
                <Step4 data={step4} onChange={setStep4} touched={touched4} />
              )}
              {step === 5 && <Step5Plan data={step5} onChange={setStep5} />}
              {step === 6 && (
                <Step6Review
                  step1={step1}
                  step2={step2}
                  step3={step3}
                  step4={step4}
                  step5={step5}
                  isPending={createOrg.isPending}
                  onSubmit={() => createOrg.mutate()}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step > 1 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={createOrg.isPending}
                data-ocid="step-back-btn"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  onClick={goNext}
                  data-ocid="step-next-btn"
                  className="gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => createOrg.mutate()}
                  disabled={createOrg.isPending}
                  data-ocid="create-org-submit"
                  className="gap-2"
                >
                  {createOrg.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Create Organization
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Organization Type ─────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
  onNext: () => void;
}) {
  const options = [
    {
      type: OrgType.company,
      label: "Company / Business",
      desc: "Registered private or public limited company, LLP, or partnership firm with GST registration.",
      icon: <Building2 className="w-7 h-7" />,
    },
    {
      type: OrgType.individual,
      label: "Individual / Sole Proprietor",
      desc: "Freelancer, sole proprietor, or unregistered individual trader. GSTIN optional.",
      icon: <User className="w-7 h-7" />,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-foreground mb-1">
        Register your organization
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        What type of business are you registering?
      </p>

      <div className="space-y-3" data-ocid="org-type-options">
        {options.map(({ type, label, desc, icon }) => {
          const active = data.orgType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                onChange({ orgType: type });
                setTimeout(onNext, 180);
              }}
              data-ocid={`org-type-${type}`}
              className={`w-full text-left p-4 rounded-lg border-2 transition-smooth flex gap-4 items-start ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-background hover:border-accent/50 hover:bg-muted/40"
              }`}
            >
              <div
                className={`shrink-0 p-2 rounded-lg transition-smooth ${active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-foreground">
                    {label}
                  </span>
                  {active && (
                    <Badge
                      variant="secondary"
                      className="text-accent border-accent/30 bg-accent/10 text-xs"
                    >
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Organization Details ─────────────────────────────────────────

function Step2({
  data,
  onChange,
  orgType,
  slugAvailable,
  checkingSlug,
  slugValid,
  gstinError,
  panError,
  touched,
}: {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
  orgType: OrgType | null;
  slugAvailable: boolean | null;
  checkingSlug: boolean;
  slugValid: boolean;
  gstinError: string | null;
  panError: string | null;
  touched: boolean;
}) {
  const nameError =
    touched && data.name.trim().length < 2
      ? "Name must be at least 2 characters"
      : null;
  const slugError =
    touched && data.slug
      ? !slugValid
        ? "Only lowercase letters, numbers and hyphens (2–48 chars)"
        : slugAvailable === false
          ? "This slug is already taken. Try another."
          : null
      : null;

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-foreground mb-1">
        Organization details
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Basic information about your organization.
      </p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="org-name" className="text-sm font-medium">
            Organization name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="org-name"
            placeholder="Acme Pvt Ltd"
            value={data.name}
            autoFocus
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            data-ocid="org-name-input"
            className={nameError ? "border-destructive" : ""}
          />
          <FieldError msg={nameError} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-slug" className="text-sm font-medium">
            Workspace URL <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="org-slug"
              placeholder="acme-pvt-ltd"
              value={data.slug}
              onChange={(e) =>
                onChange({
                  ...data,
                  slug: slugify(e.target.value),
                  slugTouched: true,
                })
              }
              className={`pr-8 ${slugError ? "border-destructive" : ""}`}
              data-ocid="org-slug-input"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {checkingSlug && (
                <span className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin block" />
              )}
              {!checkingSlug && slugAvailable === true && (
                <CheckCircle2 className="w-4 h-4 text-accent" />
              )}
              {!checkingSlug && slugAvailable === false && (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
          </div>
          {!slugError && data.slug && slugValid && slugAvailable === true && (
            <p className="text-xs text-accent">Available!</p>
          )}
          <FieldError msg={slugError} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gstin" className="text-sm font-medium">
            GSTIN{" "}
            {orgType === OrgType.company ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-muted-foreground text-xs">(optional)</span>
            )}
          </Label>
          <Input
            id="gstin"
            placeholder="22AAAAA0000A1Z5"
            value={data.gstin}
            maxLength={15}
            onChange={(e) =>
              onChange({ ...data, gstin: e.target.value.toUpperCase() })
            }
            className={`font-mono tracking-wider ${gstinError ? "border-destructive" : ""}`}
            data-ocid="gstin-input"
          />
          <FieldError msg={gstinError} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pan" className="text-sm font-medium">
            PAN{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="pan"
            placeholder="ABCDE1234F"
            value={data.pan}
            maxLength={10}
            onChange={(e) =>
              onChange({ ...data, pan: e.target.value.toUpperCase() })
            }
            className={`font-mono tracking-wider ${panError ? "border-destructive" : ""}`}
            data-ocid="pan-input"
          />
          <FieldError msg={panError} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timezone" className="text-sm font-medium">
            Timezone
          </Label>
          <Select
            value={data.timezone}
            onValueChange={(v) => onChange({ ...data, timezone: v })}
          >
            <SelectTrigger id="timezone" data-ocid="timezone-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Address ───────────────────────────────────────────────────────

function Step3({
  data,
  onChange,
  touched,
}: { data: Step3Data; onChange: (d: Step3Data) => void; touched: boolean }) {
  const streetError =
    touched && data.street.trim().length < 2
      ? "Street address is required"
      : null;
  const cityError = touched && !data.city.trim() ? "City is required" : null;
  const stateError = touched && !data.state ? "State is required" : null;
  const postalError =
    touched && !/^\d{6}$/.test(data.postal)
      ? "Enter a valid 6-digit PIN code"
      : null;

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-foreground mb-1">
        Business address
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Registered office or principal place of business.
      </p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="street" className="text-sm font-medium">
            Street address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="street"
            placeholder="123, MG Road, Bandra West"
            value={data.street}
            autoFocus
            onChange={(e) => onChange({ ...data, street: e.target.value })}
            className={streetError ? "border-destructive" : ""}
            data-ocid="address-street-input"
          />
          <FieldError msg={streetError} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm font-medium">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              placeholder="Mumbai"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              className={cityError ? "border-destructive" : ""}
              data-ocid="address-city-input"
            />
            <FieldError msg={cityError} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal" className="text-sm font-medium">
              PIN Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postal"
              placeholder="400001"
              value={data.postal}
              maxLength={6}
              onChange={(e) =>
                onChange({
                  ...data,
                  postal: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              className={`font-mono ${postalError ? "border-destructive" : ""}`}
              data-ocid="address-postal-input"
            />
            <FieldError msg={postalError} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-sm font-medium">
              State <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.state}
              onValueChange={(v) => onChange({ ...data, state: v })}
            >
              <SelectTrigger
                id="state"
                className={stateError ? "border-destructive" : ""}
                data-ocid="address-state-select"
              >
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={stateError} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-sm font-medium">
              Country
            </Label>
            <Input
              id="country"
              value={data.country}
              onChange={(e) => onChange({ ...data, country: e.target.value })}
              data-ocid="address-country-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Contact Person ────────────────────────────────────────────────

function Step4({
  data,
  onChange,
  touched,
}: { data: Step4Data; onChange: (d: Step4Data) => void; touched: boolean }) {
  const firstNameError =
    touched && !data.skip && !data.firstName.trim()
      ? "First name is required"
      : null;
  const lastNameError =
    touched && !data.skip && !data.lastName.trim()
      ? "Last name is required"
      : null;
  const phoneError = touched && !data.skip ? validatePhone(data.phone) : null;
  const emailError =
    touched && !data.skip && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
      ? "Enter a valid email address"
      : null;

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-foreground mb-1">
        Contact person
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Primary point of contact for this organization.
      </p>

      {/* Skip option */}
      <button
        type="button"
        onClick={() => onChange({ ...data, skip: !data.skip })}
        className={`w-full mb-5 text-left px-4 py-3 rounded-lg border-2 transition-smooth text-sm ${
          data.skip
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-muted-foreground hover:border-accent/40"
        }`}
        data-ocid="contact-skip-toggle"
      >
        {data.skip
          ? "✓ Skip — add contact person later"
          : "Skip this step (you can add contact details later)"}
      </button>

      {!data.skip && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first-name" className="text-sm font-medium">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first-name"
                placeholder="Arjun"
                value={data.firstName}
                autoFocus
                onChange={(e) =>
                  onChange({ ...data, firstName: e.target.value })
                }
                className={firstNameError ? "border-destructive" : ""}
                data-ocid="contact-firstname-input"
              />
              <FieldError msg={firstNameError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name" className="text-sm font-medium">
                Last name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last-name"
                placeholder="Sharma"
                value={data.lastName}
                onChange={(e) =>
                  onChange({ ...data, lastName: e.target.value })
                }
                className={lastNameError ? "border-destructive" : ""}
                data-ocid="contact-lastname-input"
              />
              <FieldError msg={lastNameError} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone number <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground font-mono shrink-0">
                +91
              </div>
              <Input
                id="phone"
                placeholder="9876543210"
                value={data.phone}
                maxLength={10}
                onChange={(e) =>
                  onChange({
                    ...data,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                className={`font-mono flex-1 ${phoneError ? "border-destructive" : ""}`}
                data-ocid="contact-phone-input"
              />
            </div>
            <FieldError msg={phoneError} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="text-sm font-medium">
              Email address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="arjun@acme.com"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className={emailError ? "border-destructive" : ""}
              data-ocid="contact-email-input"
            />
            <FieldError msg={emailError} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Subscription Plan ─────────────────────────────────────────────

const PLAN_OPTIONS = [
  {
    tier: PlanTier.free,
    label: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for getting started. Basic CRM, invoicing, and inventory.",
    features: [
      "1 Organization",
      "Up to 3 members",
      "50 invoices/mo",
      "100 inventory items",
    ],
    icon: null,
    iconBg: "bg-muted",
    highlight: false,
  },
  {
    tier: PlanTier.pro,
    label: "Pro",
    price: "₹2,499",
    period: "/month",
    desc: "For growing businesses. Full inventory, GST filing, and B2B portals.",
    features: [
      "3 Organizations",
      "Unlimited members",
      "GSTR-1 & GSTR-3B",
      "2 B2B Portals",
    ],
    icon: <Star className="w-4 h-4" />,
    iconBg: "bg-accent/10",
    highlight: true,
  },
  {
    tier: PlanTier.enterprise,
    label: "Enterprise",
    price: "₹9,999",
    period: "/month",
    desc: "All features, all B2B portals, SLA, and dedicated support.",
    features: [
      "Unlimited orgs",
      "All 5 B2B Portals",
      "Dedicated manager",
      "SLA guarantee",
    ],
    icon: <Crown className="w-4 h-4" />,
    iconBg: "bg-primary/10",
    highlight: false,
  },
];

function Step5Plan({
  data,
  onChange,
}: { data: Step5Data; onChange: (d: Step5Data) => void }) {
  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-foreground mb-1">
        Choose a plan
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        You can always upgrade or change your plan later in Settings.
      </p>

      <div className="space-y-3" data-ocid="plan-options">
        {PLAN_OPTIONS.map((plan) => {
          const active = data.plan === plan.tier;
          return (
            <button
              key={plan.tier}
              type="button"
              onClick={() => onChange({ plan: plan.tier })}
              data-ocid={`plan-${plan.tier}`}
              className={`w-full text-left p-4 rounded-xl border-2 transition-smooth ${
                active
                  ? "border-accent bg-accent/8 ring-1 ring-accent/20"
                  : "border-border bg-background hover:border-accent/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${plan.iconBg} border border-border flex items-center justify-center flex-shrink-0 mt-0.5 text-accent`}
                  >
                    {plan.icon ?? (
                      <span className="text-xs font-bold text-muted-foreground">
                        F
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-semibold text-foreground">
                        {plan.label}
                      </span>
                      {plan.highlight && (
                        <Badge className="bg-accent text-accent-foreground text-[10px] py-0 px-1.5">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {plan.desc}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {plan.features.map((f) => (
                        <span
                          key={f}
                          className="text-[11px] text-muted-foreground flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-accent" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-display font-bold text-foreground text-lg leading-none">
                    {plan.price}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.period}
                  </p>
                </div>
              </div>
              {active && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-accent font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 6: Review ────────────────────────────────────────────────────────

function Step6Review({
  step1,
  step2,
  step3,
  step4,
  step5,
  isPending,
  onSubmit,
}: {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  isPending: boolean;
  onSubmit: () => void;
}) {
  const rows = [
    {
      label: "Organization type",
      value:
        step1.orgType === OrgType.company
          ? "Company / Business"
          : "Individual / Sole Proprietor",
    },
    { label: "Name", value: step2.name },
    { label: "Workspace slug", value: step2.slug },
    { label: "Timezone", value: step2.timezone },
    { label: "GSTIN", value: step2.gstin || "—" },
    { label: "PAN", value: step2.pan || "—" },
    {
      label: "Address",
      value: `${step3.street}, ${step3.city}, ${step3.state} – ${step3.postal}`,
    },
    {
      label: "Contact person",
      value: step4.skip
        ? "—"
        : `${step4.firstName} ${step4.lastName} · +91 ${step4.phone}`,
    },
    {
      label: "Plan",
      value:
        PLAN_OPTIONS.find((p) => p.tier === step5.plan)?.label ?? step5.plan,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-foreground mb-1">
        Review &amp; confirm
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Double-check your details before creating the organization.
      </p>

      <div
        className="rounded-lg border border-border overflow-hidden"
        data-ocid="review-summary"
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-start gap-4 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-muted/30" : "bg-background"}`}
          >
            <span className="text-muted-foreground w-36 shrink-0">
              {row.label}
            </span>
            <span className="text-foreground font-medium break-all">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <Button
        className="w-full mt-6 h-10 gap-2 font-medium"
        onClick={onSubmit}
        disabled={isPending}
        data-ocid="create-org-submit-final"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Creating organization…
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" /> Create Organization
          </>
        )}
      </Button>
    </div>
  );
}
