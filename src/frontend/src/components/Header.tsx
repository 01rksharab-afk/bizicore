import type { OrgSummary } from "@/backend";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";

interface HeaderProps {
  onMenuOpen: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Header({ onMenuOpen }: HeaderProps) {
  const { isAuthenticated, login, logout, profile, isConnecting } = useAuth();
  const { activeOrg, orgs, setActiveOrg } = useActiveOrg();

  const displayName = profile?.name ?? "User";

  return (
    <header
      className="h-14 bg-card border-b border-border flex items-center justify-between px-4 gap-3 shrink-0 z-20"
      data-ocid="header"
    >
      {/* Left: hamburger + org picker */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden size-8 text-muted-foreground"
          onClick={onMenuOpen}
          aria-label="Open menu"
          data-ocid="header-menu-toggle"
        >
          <Menu className="size-4" />
        </Button>

        {/* Org selector */}
        {isAuthenticated && activeOrg ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-1.5 h-8 px-2 text-sm font-medium min-w-0 max-w-[180px]"
                data-ocid="org-selector"
              >
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{activeOrg.name}</span>
                <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Your organizations
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orgs.map((org: OrgSummary) => (
                <DropdownMenuItem
                  key={org.id.toString()}
                  onClick={() => setActiveOrg(org)}
                  className="flex items-center gap-2 cursor-pointer"
                  data-ocid="org-option"
                >
                  <div className="size-5 rounded bg-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                    {getInitials(org.name)}
                  </div>
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrg.id && (
                    <span className="ml-auto size-1.5 rounded-full bg-accent shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/settings/org/new"
                  className="flex items-center gap-2 cursor-pointer"
                  data-ocid="create-org-link"
                >
                  <span className="text-muted-foreground">
                    + Create organization
                  </span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* Right: connecting badge + user menu */}
      <div className="flex items-center gap-2 shrink-0">
        {isConnecting && (
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground"
            data-ocid="connecting-badge"
          >
            <Loader2 className="size-3 animate-spin" />
            <span>Connecting…</span>
          </div>
        )}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-8 px-2 text-sm"
                data-ocid="user-menu-trigger"
              >
                <Avatar className="size-6">
                  <AvatarFallback className="bg-accent/20 text-accent text-xs font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block font-medium max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium truncate">
                  {displayName}
                </div>
                {profile?.email && (
                  <div className="text-xs text-muted-foreground truncate">
                    {profile.email}
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/settings/profile"
                  className="flex items-center gap-2 cursor-pointer"
                  data-ocid="user-profile-link"
                >
                  <User className="size-3.5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings"
                  search={{ tab: "profile" }}
                  className="flex items-center gap-2 cursor-pointer"
                  data-ocid="user-settings-link"
                >
                  <Settings className="size-3.5" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                data-ocid="user-logout"
              >
                <LogOut className="size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            onClick={login}
            className="h-8"
            data-ocid="header-login-btn"
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
