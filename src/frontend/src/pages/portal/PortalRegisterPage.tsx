import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/context/PortalAuthContext";
import {
  usePortalRegisterCompany,
  usePortalRegisterGroup,
  usePortalRegisterIndividual,
} from "@/hooks/usePortal";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="form-error flex items-center gap-1 mt-1">
      <AlertCircle className="size-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

function validatePassword(pw: string): string | undefined {
  if (!pw) return "Password is required";
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pw))
    return "Password must contain at least 1 uppercase letter";
  if (!/[0-9]/.test(pw)) return "Password must contain at least 1 number";
  return undefined;
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
  return undefined;
}

// ─── Company / Org Form ───────────────────────────────────────────────────────

function CompanyForm() {
  const { loginAsAdmin } = usePortalAuth();
  const navigate = useNavigate();
  const mutation = usePortalRegisterCompany();

  const [f, setF] = useState({
    companyName: "",
    companyType: "",
    gst: "",
    industry: "",
    website: "",
    street: "",
    city: "",
    state: "",
    pin: "",
    adminName: "",
    adminDesignation: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(k: string, v: string | boolean) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!f.companyName) e.companyName = "Company name is required";
    if (!f.companyType) e.companyType = "Company type is required";
    if (!f.industry) e.industry = "Industry/Sector is required";
    if (!f.street) e.street = "Street address is required";
    if (!f.city) e.city = "City is required";
    if (!f.state) e.state = "State is required";
    if (!f.pin) e.pin = "PIN code is required";
    else if (!/^\d{6}$/.test(f.pin)) e.pin = "PIN must be 6 digits";
    if (!f.adminName) e.adminName = "Admin name is required";
    if (!f.adminDesignation) e.adminDesignation = "Designation is required";
    const emailErr = validateEmail(f.adminEmail);
    if (emailErr) e.adminEmail = emailErr;
    if (!f.adminPhone) e.adminPhone = "Phone is required";
    else if (!/^\d{10}$/.test(f.adminPhone.replace(/\s/g, "")))
      e.adminPhone = "Enter a valid 10-digit phone number";
    const pwErr = validatePassword(f.password);
    if (pwErr) e.password = pwErr;
    if (!f.confirmPassword) e.confirmPassword = "Please confirm password";
    else if (f.password !== f.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!f.terms) e.terms = "You must accept the Terms & Conditions";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const session = await mutation.mutateAsync({
        companyName: f.companyName,
        companyType: f.companyType,
        gst: f.gst,
        industry: f.industry,
        website: f.website,
        street: f.street,
        city: f.city,
        state: f.state,
        pin: f.pin,
        adminName: f.adminName,
        adminDesignation: f.adminDesignation,
        adminEmail: f.adminEmail,
        adminPhone: f.adminPhone,
        password: f.password,
      });
      loginAsAdmin(session);
      navigate({ to: "/portal/admin/dashboard" });
    } catch {
      // error shown via toast
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="registration-form"
      noValidate
      data-ocid="company-registration-form"
    >
      <fieldset className="space-y-4">
        <legend className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Company Details
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="c-name" className="form-label">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              id="c-name"
              className="form-input"
              placeholder="Acme Corp"
              value={f.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              data-ocid="company-name"
            />
            <FieldError msg={errors.companyName} />
          </div>
          <div className="form-group">
            <label htmlFor="c-type" className="form-label">
              Company Type <span className="text-destructive">*</span>
            </label>
            <select
              id="c-type"
              className="form-select"
              value={f.companyType}
              onChange={(e) => set("companyType", e.target.value)}
              data-ocid="company-type"
            >
              <option value="">Select type</option>
              {[
                "Pvt Ltd",
                "LLP",
                "Partnership",
                "Sole Proprietor",
                "Other",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <FieldError msg={errors.companyType} />
          </div>
          <div className="form-group">
            <label htmlFor="c-gst" className="form-label">
              GST Number{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="c-gst"
              className="form-input"
              placeholder="22AAAAA0000A1Z5"
              value={f.gst}
              onChange={(e) => set("gst", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="c-industry" className="form-label">
              Industry / Sector <span className="text-destructive">*</span>
            </label>
            <input
              id="c-industry"
              className="form-input"
              placeholder="e.g. Manufacturing, IT, Retail"
              value={f.industry}
              onChange={(e) => set("industry", e.target.value)}
              data-ocid="company-industry"
            />
            <FieldError msg={errors.industry} />
          </div>
          <div className="form-group sm:col-span-2">
            <label htmlFor="c-website" className="form-label">
              Website{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="c-website"
              className="form-input"
              placeholder="https://example.com"
              value={f.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Registered Address
        </legend>
        <div className="form-group">
          <label htmlFor="c-street" className="form-label">
            Street <span className="text-destructive">*</span>
          </label>
          <input
            id="c-street"
            className="form-input"
            placeholder="123 Main Street"
            value={f.street}
            onChange={(e) => set("street", e.target.value)}
            data-ocid="company-street"
          />
          <FieldError msg={errors.street} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="form-group">
            <label htmlFor="c-city" className="form-label">
              City <span className="text-destructive">*</span>
            </label>
            <input
              id="c-city"
              className="form-input"
              placeholder="Mumbai"
              value={f.city}
              onChange={(e) => set("city", e.target.value)}
              data-ocid="company-city"
            />
            <FieldError msg={errors.city} />
          </div>
          <div className="form-group">
            <label htmlFor="c-state" className="form-label">
              State <span className="text-destructive">*</span>
            </label>
            <input
              id="c-state"
              className="form-input"
              placeholder="Maharashtra"
              value={f.state}
              onChange={(e) => set("state", e.target.value)}
              data-ocid="company-state"
            />
            <FieldError msg={errors.state} />
          </div>
          <div className="form-group">
            <label htmlFor="c-pin" className="form-label">
              PIN Code <span className="text-destructive">*</span>
            </label>
            <input
              id="c-pin"
              className="form-input"
              placeholder="400001"
              value={f.pin}
              onChange={(e) => set("pin", e.target.value)}
              data-ocid="company-pin"
            />
            <FieldError msg={errors.pin} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Admin Information
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="c-admin-name" className="form-label">
              Admin Full Name <span className="text-destructive">*</span>
            </label>
            <input
              id="c-admin-name"
              className="form-input"
              placeholder="Rajesh Kumar"
              value={f.adminName}
              onChange={(e) => set("adminName", e.target.value)}
              data-ocid="admin-name"
            />
            <FieldError msg={errors.adminName} />
          </div>
          <div className="form-group">
            <label htmlFor="c-admin-designation" className="form-label">
              Admin Designation <span className="text-destructive">*</span>
            </label>
            <input
              id="c-admin-designation"
              className="form-input"
              placeholder="CEO / Director"
              value={f.adminDesignation}
              onChange={(e) => set("adminDesignation", e.target.value)}
              data-ocid="admin-designation"
            />
            <FieldError msg={errors.adminDesignation} />
          </div>
          <div className="form-group">
            <label htmlFor="c-admin-email" className="form-label">
              Admin Email (Login ID) <span className="text-destructive">*</span>
            </label>
            <input
              id="c-admin-email"
              className="form-input"
              type="email"
              placeholder="admin@company.com"
              value={f.adminEmail}
              onChange={(e) => set("adminEmail", e.target.value)}
              data-ocid="admin-email"
            />
            <FieldError msg={errors.adminEmail} />
          </div>
          <div className="form-group">
            <label htmlFor="c-admin-phone" className="form-label">
              Admin Phone <span className="text-destructive">*</span>
            </label>
            <input
              id="c-admin-phone"
              className="form-input"
              type="tel"
              placeholder="9876543210"
              value={f.adminPhone}
              onChange={(e) => set("adminPhone", e.target.value)}
              data-ocid="admin-phone"
            />
            <FieldError msg={errors.adminPhone} />
          </div>
          <div className="form-group">
            <label htmlFor="c-password" className="form-label">
              Password <span className="text-destructive">*</span>
            </label>
            <input
              id="c-password"
              className="form-input"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              data-ocid="admin-password"
            />
            <FieldError msg={errors.password} />
          </div>
          <div className="form-group">
            <label htmlFor="c-confirm-password" className="form-label">
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <input
              id="c-confirm-password"
              className="form-input"
              type="password"
              placeholder="Re-enter password"
              value={f.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              data-ocid="admin-confirm-password"
            />
            <FieldError msg={errors.confirmPassword} />
          </div>
        </div>
      </fieldset>

      <div className="form-group">
        <label htmlFor="c-logo" className="form-label">
          Company Logo{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          id="c-logo"
          className="form-input text-sm"
          type="file"
          accept="image/*"
          data-ocid="company-logo"
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          checked={f.terms}
          onChange={(e) => set("terms", e.target.checked)}
          data-ocid="terms-checkbox"
        />
        <div>
          <label
            htmlFor="terms"
            className="text-sm text-foreground cursor-pointer"
          >
            I agree to the{" "}
            <span className="text-primary underline cursor-pointer">
              Terms & Conditions
            </span>{" "}
            <span className="text-destructive">*</span>
          </label>
          <FieldError msg={errors.terms} />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending}
        data-ocid="company-register-submit"
      >
        {mutation.isPending ? "Creating account..." : "Create Admin Account"}
      </Button>
    </form>
  );
}

// ─── Multi Group Form ─────────────────────────────────────────────────────────

function GroupForm() {
  const { loginAsAdmin } = usePortalAuth();
  const navigate = useNavigate();
  const mutation = usePortalRegisterGroup();

  const [f, setF] = useState({
    groupName: "",
    groupType: "",
    groupDescription: "",
    groupHeadName: "",
    contactEmail: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(k: string, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!f.groupName) e.groupName = "Group name is required";
    if (!f.groupType) e.groupType = "Group type is required";
    if (!f.groupDescription) e.groupDescription = "Description is required";
    if (!f.groupHeadName) e.groupHeadName = "Group head name is required";
    const emailErr = validateEmail(f.contactEmail);
    if (emailErr) e.contactEmail = emailErr;
    if (!f.phone) e.phone = "Phone is required";
    const pwErr = validatePassword(f.password);
    if (pwErr) e.password = pwErr;
    if (f.password !== f.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const session = await mutation.mutateAsync(f);
      loginAsAdmin(session);
      navigate({ to: "/portal/admin/dashboard" });
    } catch {
      // error shown via toast
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="registration-form"
      noValidate
      data-ocid="group-registration-form"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="g-name" className="form-label">
            Group Name <span className="text-destructive">*</span>
          </label>
          <input
            id="g-name"
            className="form-input"
            placeholder="Sunrise Society"
            value={f.groupName}
            onChange={(e) => set("groupName", e.target.value)}
            data-ocid="group-name"
          />
          <FieldError msg={errors.groupName} />
        </div>
        <div className="form-group">
          <label htmlFor="g-type" className="form-label">
            Group Type <span className="text-destructive">*</span>
          </label>
          <select
            id="g-type"
            className="form-select"
            value={f.groupType}
            onChange={(e) => set("groupType", e.target.value)}
            data-ocid="group-type"
          >
            <option value="">Select type</option>
            {["Society", "NGO", "Club", "Department", "Other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <FieldError msg={errors.groupType} />
        </div>
        <div className="form-group sm:col-span-2">
          <label htmlFor="g-desc" className="form-label">
            Group Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="g-desc"
            className="form-textarea"
            rows={3}
            placeholder="Brief description of the group..."
            value={f.groupDescription}
            onChange={(e) => set("groupDescription", e.target.value)}
            data-ocid="group-description"
          />
          <FieldError msg={errors.groupDescription} />
        </div>
        <div className="form-group sm:col-span-2">
          <label htmlFor="g-head" className="form-label">
            Group Head Name <span className="text-destructive">*</span>
          </label>
          <input
            id="g-head"
            className="form-input"
            placeholder="Priya Sharma"
            value={f.groupHeadName}
            onChange={(e) => set("groupHeadName", e.target.value)}
            data-ocid="group-head-name"
          />
          <FieldError msg={errors.groupHeadName} />
        </div>
        <div className="form-group">
          <label htmlFor="g-email" className="form-label">
            Contact Email (Login ID) <span className="text-destructive">*</span>
          </label>
          <input
            id="g-email"
            className="form-input"
            type="email"
            placeholder="head@group.org"
            value={f.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            data-ocid="group-email"
          />
          <FieldError msg={errors.contactEmail} />
        </div>
        <div className="form-group">
          <label htmlFor="g-phone" className="form-label">
            Phone <span className="text-destructive">*</span>
          </label>
          <input
            id="g-phone"
            className="form-input"
            type="tel"
            placeholder="9876543210"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
            data-ocid="group-phone"
          />
          <FieldError msg={errors.phone} />
        </div>
        <div className="form-group">
          <label htmlFor="g-password" className="form-label">
            Password <span className="text-destructive">*</span>
          </label>
          <input
            id="g-password"
            className="form-input"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={f.password}
            onChange={(e) => set("password", e.target.value)}
            data-ocid="group-password"
          />
          <FieldError msg={errors.password} />
        </div>
        <div className="form-group">
          <label htmlFor="g-confirm" className="form-label">
            Confirm Password <span className="text-destructive">*</span>
          </label>
          <input
            id="g-confirm"
            className="form-input"
            type="password"
            placeholder="Re-enter password"
            value={f.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            data-ocid="group-confirm-password"
          />
          <FieldError msg={errors.confirmPassword} />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending}
        data-ocid="group-register-submit"
      >
        {mutation.isPending ? "Creating account..." : "Create Group Account"}
      </Button>
    </form>
  );
}

// ─── Individual Form ──────────────────────────────────────────────────────────

function IndividualForm() {
  const { loginAsAdmin } = usePortalAuth();
  const navigate = useNavigate();
  const mutation = usePortalRegisterIndividual();

  const [f, setF] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(k: string, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!f.fullName) e.fullName = "Full name is required";
    const emailErr = validateEmail(f.email);
    if (emailErr) e.email = emailErr;
    if (!f.phone) e.phone = "Phone is required";
    const pwErr = validatePassword(f.password);
    if (pwErr) e.password = pwErr;
    if (f.password !== f.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const session = await mutation.mutateAsync(f);
      loginAsAdmin(session);
      navigate({ to: "/portal/admin/dashboard" });
    } catch {
      // error shown via toast
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="registration-form"
      noValidate
      data-ocid="individual-registration-form"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group sm:col-span-2">
          <label htmlFor="i-name" className="form-label">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="i-name"
            className="form-input"
            placeholder="Amit Patel"
            value={f.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            data-ocid="individual-name"
          />
          <FieldError msg={errors.fullName} />
        </div>
        <div className="form-group">
          <label htmlFor="i-email" className="form-label">
            Email (Login ID) <span className="text-destructive">*</span>
          </label>
          <input
            id="i-email"
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            data-ocid="individual-email"
          />
          <FieldError msg={errors.email} />
        </div>
        <div className="form-group">
          <label htmlFor="i-phone" className="form-label">
            Phone <span className="text-destructive">*</span>
          </label>
          <input
            id="i-phone"
            className="form-input"
            type="tel"
            placeholder="9876543210"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
            data-ocid="individual-phone"
          />
          <FieldError msg={errors.phone} />
        </div>
        <div className="form-group">
          <label htmlFor="i-password" className="form-label">
            Password <span className="text-destructive">*</span>
          </label>
          <input
            id="i-password"
            className="form-input"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={f.password}
            onChange={(e) => set("password", e.target.value)}
            data-ocid="individual-password"
          />
          <FieldError msg={errors.password} />
        </div>
        <div className="form-group">
          <label htmlFor="i-confirm" className="form-label">
            Confirm Password <span className="text-destructive">*</span>
          </label>
          <input
            id="i-confirm"
            className="form-input"
            type="password"
            placeholder="Re-enter password"
            value={f.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            data-ocid="individual-confirm-password"
          />
          <FieldError msg={errors.confirmPassword} />
        </div>
        <div className="form-group sm:col-span-2">
          <label htmlFor="i-photo" className="form-label">
            Profile Photo{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <input
            id="i-photo"
            className="form-input text-sm"
            type="file"
            accept="image/*"
            data-ocid="individual-photo"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending}
        data-ocid="individual-register-submit"
      >
        {mutation.isPending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}

// ─── Account Type Selector ────────────────────────────────────────────────────

type AccountType = "company" | "group" | "individual";

const ACCOUNT_TYPES: {
  type: AccountType;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    type: "company",
    label: "Company / Organization",
    subtitle: "For businesses and organizations",
    icon: Building2,
    description:
      "Register your business, manage a team, assign tasks and track productivity across departments.",
  },
  {
    type: "group",
    label: "Multi Group",
    subtitle: "For societies, NGOs, clubs",
    icon: Users,
    description:
      "Coordinate group activities, manage members, and keep track of tasks across departments.",
  },
  {
    type: "individual",
    label: "Individual",
    subtitle: "For freelancers and solo users",
    icon: User,
    description:
      "Personal workspace to manage your tasks, projects, and productivity as an individual.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortalRegisterPage() {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
          <BriefcaseBusiness className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground leading-none">
            BizCore
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create your account
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl space-y-8">
        {/* Step 1: Account type */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-1">
            Choose account type
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Select the type that best describes you or your organization.
          </p>
          <div
            className="registration-type-selector"
            data-ocid="account-type-selector"
          >
            {ACCOUNT_TYPES.map(
              ({ type, label, subtitle, icon: Icon, description }) => {
                const isActive = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "registration-type-card",
                      isActive && "active",
                    )}
                    data-ocid={`account-type-${type}`}
                  >
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center mb-3 transition-smooth",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-6" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-display font-semibold text-foreground">
                        {label}
                      </span>
                      {isActive && (
                        <CheckCircle2 className="size-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                    {isActive && (
                      <p className="text-xs text-foreground/70 mt-2 text-center leading-relaxed">
                        {description}
                      </p>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Step 2: Dynamic form */}
        {selectedType && (
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-6 fade-in">
            <div>
              <h3 className="text-base font-display font-semibold text-foreground">
                {selectedType === "company"
                  ? "Company / Organization Details"
                  : selectedType === "group"
                    ? "Group Details"
                    : "Personal Details"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fields marked with <span className="text-destructive">*</span>{" "}
                are required.
              </p>
            </div>
            {selectedType === "company" && <CompanyForm />}
            {selectedType === "group" && <GroupForm />}
            {selectedType === "individual" && <IndividualForm />}
          </div>
        )}

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a
            href="/portal/login"
            className="text-primary font-medium hover:underline"
            data-ocid="portal-login-link"
          >
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}
