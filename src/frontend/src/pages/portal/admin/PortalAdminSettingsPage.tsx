import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePortalAuth } from "@/context/PortalAuthContext";
import {
  usePortalCompanyId,
  usePortalCreateNotification,
  usePortalEmployees,
} from "@/hooks/usePortal";
import { Bell, Building2, Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PortalAdminSettingsPage() {
  const { portalSession } = usePortalAuth();
  const companyId = usePortalCompanyId();
  const { data: employees = [] } = usePortalEmployees(companyId);
  const createNotification = usePortalCreateNotification();

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");
  const [errors, setErrors] = useState<{ title?: string; message?: string }>(
    {},
  );

  const adminSession =
    portalSession?.role === "portalAdmin" ? portalSession : null;
  const activeEmployees = employees.filter((e) => e.status === "active");

  const validateNotif = () => {
    const errs: { title?: string; message?: string } = {};
    if (!notifTitle.trim()) errs.title = "Title is required";
    if (!notifMessage.trim()) errs.message = "Message is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendNotification = () => {
    if (!validateNotif() || !companyId) return;

    if (notifTarget === "all") {
      // Send to all active employees
      const promises = activeEmployees.map((emp) =>
        createNotification.mutateAsync({
          message: `${notifTitle}: ${notifMessage}`,
          recipientEmployeeId: emp.employeeId,
          companyId,
        }),
      );
      if (promises.length === 0) {
        toast.error("No active employees to notify");
        return;
      }
      Promise.all(promises).then(() => {
        setNotifTitle("");
        setNotifMessage("");
        setNotifTarget("all");
        setErrors({});
      });
    } else {
      createNotification.mutate(
        {
          message: `${notifTitle}: ${notifMessage}`,
          recipientEmployeeId: notifTarget,
          companyId,
        },
        {
          onSuccess: () => {
            setNotifTitle("");
            setNotifMessage("");
            setNotifTarget("all");
            setErrors({});
          },
        },
      );
    }
  };

  return (
    <PortalLayout requiredRole="portalAdmin">
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Company information and notification management
          </p>
        </div>

        {/* Company Info */}
        <Card className="shadow-sm" data-ocid="settings-company-info">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="size-4 text-primary" />
              </div>
              <CardTitle className="text-base">Company Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {adminSession ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Company Name
                  </Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                    <Building2 className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {adminSession.company.name}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Company Type
                  </Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                    <Badge variant="secondary" className="font-normal">
                      {adminSession.company.type}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Admin Name
                  </Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {adminSession.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground">
                      {adminSession.name}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Designation
                  </Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                    <span className="text-sm text-foreground">
                      {adminSession.designation}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Admin Email
                  </Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                    <Mail className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      {adminSession.email}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No company info available.
              </p>
            )}

            <Separator className="my-4" />

            {/* Employee Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="text-2xl font-display font-bold text-foreground">
                  {employees.filter((e) => e.status === "active").length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Active Employees
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="text-2xl font-display font-bold text-foreground">
                  {employees.filter((e) => e.status === "inactive").length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Inactive
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <div className="text-2xl font-display font-bold text-foreground">
                  {employees.length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-sm" data-ocid="settings-notifications">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="size-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">Send Notification</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Broadcast messages to employees
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Title *</Label>
              <Input
                id="notif-title"
                value={notifTitle}
                onChange={(e) => {
                  setNotifTitle(e.target.value);
                  setErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder="Notification title"
                data-ocid="notif-title"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-message">Message *</Label>
              <Textarea
                id="notif-message"
                value={notifMessage}
                onChange={(e) => {
                  setNotifMessage(e.target.value);
                  setErrors((p) => ({ ...p, message: undefined }));
                }}
                placeholder="Write your message here..."
                rows={4}
                data-ocid="notif-message"
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-target">Send To</Label>
              <Select value={notifTarget} onValueChange={setNotifTarget}>
                <SelectTrigger id="notif-target" data-ocid="notif-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <span>All Employees</span>
                      <Badge variant="secondary" className="text-xs">
                        {activeEmployees.length}
                      </Badge>
                    </div>
                  </SelectItem>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{emp.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {emp.department}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {notifTarget === "all" && activeEmployees.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Will be sent to {activeEmployees.length} active employee(s)
                </p>
              )}
              {activeEmployees.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No active employees to notify. Add team members first.
                </p>
              )}
            </div>
            <Button
              onClick={handleSendNotification}
              disabled={
                createNotification.isPending || activeEmployees.length === 0
              }
              className="w-full gap-2"
              data-ocid="send-notification-btn"
            >
              <Send className="size-4" />
              {createNotification.isPending
                ? "Sending..."
                : "Send Notification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
