import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Check, Copy, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ProfilePage() {
  const { profile, saveProfile, identity, isAuthenticated } = useAuth();

  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  const principalText = identity?.getPrincipal().toText() ?? "—";

  const copyPrincipal = () => {
    navigator.clipboard.writeText(principalText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    saveProfile(
      { name: name.trim(), email: email.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Profile saved");
          setSaving(false);
        },
        onError: () => {
          toast.error("Failed to save profile");
          setSaving(false);
        },
      },
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl" data-ocid="profile-page">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and account details.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-xl"
      >
        {/* Avatar section */}
        <div className="p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {profile?.name || "Your name"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {profile?.email || "No email set"}
            </p>
          </div>
        </div>

        <Separator />

        {/* Form */}
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-sm font-medium">
              Full name
            </Label>
            <Input
              id="profile-name"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="profile-name-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                data-ocid="profile-email-input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for invoice notifications and team invites.
            </p>
          </div>
        </div>

        <Separator />

        {/* Principal */}
        <div className="p-6 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Internet Identity Principal
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your unique identifier on the Internet Computer.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 text-xs bg-muted text-muted-foreground px-3 py-2 rounded-md font-mono truncate">
              {principalText}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyPrincipal}
              className="flex-shrink-0 h-8 w-8"
              data-ocid="copy-principal-btn"
              aria-label="Copy principal"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="p-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-6"
            data-ocid="save-profile-btn"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
