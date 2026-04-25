import { PortalLayout } from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { usePortalChangeEmployeePassword } from "@/hooks/usePortal";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, KeyRound, Shield, User, X } from "lucide-react";
import { useState } from "react";

// ─── Password Modal ────────────────────────────────────────────────────────────

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

function ChangePasswordModal({
  employeeId,
  companyId,
  onClose,
}: {
  employeeId: string;
  companyId: string;
  onClose: () => void;
}) {
  const changePwd = usePortalChangeEmployeePassword();
  const [form, setForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});
  const [showFields, setShowFields] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  function validate(): boolean {
    const e: Partial<PasswordForm> = {};
    if (!form.current) e.current = "Current password is required";
    if (form.next.length < 8) e.next = "Minimum 8 characters";
    else if (!/[A-Z]/.test(form.next))
      e.next = "Must contain an uppercase letter";
    else if (!/[0-9]/.test(form.next)) e.next = "Must contain a number";
    if (form.next !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    changePwd.mutate(
      {
        employeeId,
        companyId,
        currentPassword: form.current,
        newPassword: form.next,
      },
      { onSuccess: onClose },
    );
  }

  function field(key: keyof PasswordForm, label: string) {
    const visible = showFields[key];
    return (
      <div className="form-group">
        <label htmlFor={`pwd-${key}`} className="form-label">
          {label}
        </label>
        <div className="relative">
          <input
            id={`pwd-${key}`}
            type={visible ? "text" : "password"}
            className={cn(
              "form-input pr-10",
              errors[key] && "border-destructive",
            )}
            value={form[key]}
            onChange={(ev) =>
              setForm((f) => ({ ...f, [key]: ev.target.value }))
            }
            autoComplete="off"
            data-ocid={`pwd-field-${key}`}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowFields((s) => ({ ...s, [key]: !s[key] }))}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors[key] && <p className="form-error">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <dialog
        open
        className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl p-0 m-0"
        aria-labelledby="change-pwd-title"
        onClose={onClose}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <h2
              id="change-pwd-title"
              className="text-base font-display font-semibold text-foreground"
            >
              Change Password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {field("current", "Current Password")}
          {field("next", "New Password")}
          {field("confirm", "Confirm New Password")}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={changePwd.isPending}
              data-ocid="change-pwd-submit"
            >
              {changePwd.isPending ? "Saving..." : "Update Password"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

// ─── Profile Info Row ─────────────────────────────────────────────────────────

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sm:w-36 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Inner content ────────────────────────────────────────────────────────────

function ProfileContent({
  employeeId,
  name,
  designation,
  department,
  companyId,
  companyName,
}: {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  companyId: string;
  companyName: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your account information (read-only)
        </p>
      </div>

      {/* Avatar + name card */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="size-8 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-display font-bold text-foreground truncate">
            {name}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {designation}
          </p>
          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <Shield className="size-3" />
            {employeeId}
          </span>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-display font-semibold text-foreground mb-4">
          Account Details
        </h2>
        <ProfileRow label="Employee ID" value={employeeId} />
        <ProfileRow label="Full Name" value={name} />
        <ProfileRow label="Designation" value={designation} />
        <ProfileRow label="Department" value={department} />
        <ProfileRow label="Company" value={companyName} />
        <div className="py-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Status
          </span>
          <div className="mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent-foreground">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Security card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-display font-semibold text-foreground mb-1">
          Security
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Update your login password
        </p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowModal(true)}
          data-ocid="open-change-pwd-modal"
        >
          <KeyRound className="size-4" />
          Change Password
        </Button>
      </div>

      {showModal && (
        <ChangePasswordModal
          employeeId={employeeId}
          companyId={companyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalEmployeeProfilePage() {
  const { portalSession } = usePortalAuth();
  const session =
    portalSession?.role === "portalEmployee" ? portalSession : null;

  return (
    <PortalLayout requiredRole="portalEmployee">
      {session ? (
        <ProfileContent
          employeeId={session.employeeId}
          name={session.name}
          designation={session.designation}
          department={session.department}
          companyId={session.companyId}
          companyName={session.companyName}
        />
      ) : null}
    </PortalLayout>
  );
}
