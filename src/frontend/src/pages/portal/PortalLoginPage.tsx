import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { usePortalLoginAdmin, usePortalLoginEmployee } from "@/hooks/usePortal";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BriefcaseBusiness,
  IdCard,
  KeyRound,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";

// ─── Field Error ──────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="form-error flex items-center gap-1 mt-1">
      <AlertCircle className="size-3" />
      {msg}
    </p>
  );
}

// ─── Admin Login Form ─────────────────────────────────────────────────────────

function AdminLoginForm() {
  const { loginAsAdmin } = usePortalAuth();
  const navigate = useNavigate();
  const loginMutation = usePortalLoginAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const session = await loginMutation.mutateAsync({ email, password });
      loginAsAdmin(session);
      navigate({ to: "/portal/admin/dashboard" });
    } catch {
      // error shown via toast from hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="form-group">
        <label htmlFor="admin-email" className="form-label">
          Admin Email <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="admin-email"
            type="email"
            className="form-input pl-10"
            placeholder="admin@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validate}
            autoComplete="email"
            data-ocid="admin-login-email"
          />
        </div>
        <FieldError msg={errors.email} />
      </div>

      <div className="form-group">
        <label htmlFor="admin-password" className="form-label">
          Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="admin-password"
            type="password"
            className="form-input pl-10"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            data-ocid="admin-login-password"
          />
        </div>
        <FieldError msg={errors.password} />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
        data-ocid="admin-login-submit"
      >
        {loginMutation.isPending ? "Signing in..." : "Sign In as Admin"}
      </Button>
    </form>
  );
}

// ─── Employee Login Form ──────────────────────────────────────────────────────

function EmployeeLoginForm() {
  const { loginAsEmployee } = usePortalAuth();
  const navigate = useNavigate();
  const loginMutation = usePortalLoginEmployee();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!employeeId) e.employeeId = "Employee ID is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const session = await loginMutation.mutateAsync({ employeeId, password });
      loginAsEmployee(session);
      navigate({ to: "/portal/employee/dashboard" });
    } catch {
      // error shown via toast from hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="form-group">
        <label htmlFor="emp-id" className="form-label">
          Employee ID <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="emp-id"
            type="text"
            className="form-input pl-10"
            placeholder="e.g. EMP12345"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            onBlur={validate}
            data-ocid="employee-login-id"
          />
        </div>
        <FieldError msg={errors.employeeId} />
      </div>

      <div className="form-group">
        <label htmlFor="emp-password" className="form-label">
          Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="emp-password"
            type="password"
            className="form-input pl-10"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            data-ocid="employee-login-password"
          />
        </div>
        <FieldError msg={errors.password} />
      </div>

      <Button
        type="submit"
        variant="outline"
        className="w-full border-accent/40 hover:bg-accent/5 hover:text-accent"
        disabled={loginMutation.isPending}
        data-ocid="employee-login-submit"
      >
        {loginMutation.isPending ? "Signing in..." : "Sign In as Employee"}
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortalLoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
          <BriefcaseBusiness className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground leading-none">
            BizCore
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Portal Login</p>
        </div>
      </div>

      {/* Two login panels */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">
                Admin Login
              </h2>
              <p className="text-xs text-muted-foreground">
                Full dashboard access
              </p>
            </div>
          </div>
          <AdminLoginForm />
        </div>

        {/* Employee */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <User className="size-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">
                Employee Login
              </h2>
              <p className="text-xs text-muted-foreground">
                Access your assigned tasks
              </p>
            </div>
          </div>
          <EmployeeLoginForm />
        </div>
      </div>

      {/* Register link */}
      <p className="mt-8 text-sm text-muted-foreground">
        Don't have an account?{" "}
        <a
          href="/portal/register"
          className="text-primary font-medium hover:underline"
          data-ocid="portal-register-link"
        >
          Register here
        </a>
      </p>
    </div>
  );
}
