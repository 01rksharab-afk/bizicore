import type { BreadcrumbItem } from "@/types";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1 min-w-0">
            {idx > 0 && (
              <ChevronRight className="size-3.5 shrink-0 opacity-50" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground truncate">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors duration-150 truncate"
                data-ocid="breadcrumb-link"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
