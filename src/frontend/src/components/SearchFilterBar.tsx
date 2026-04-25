import { useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  label: string;
  key: string;
  options: FilterOption[];
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  placeholder?: string;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  placeholder = "Search...",
}: SearchFilterBarProps) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync filter values to URL query params
  const syncToUrl = useCallback(
    (key: string, value: string) => {
      navigate({
        // @ts-expect-error dynamic params
        search: (prev: Record<string, string>) => {
          const next = { ...prev };
          if (value) {
            next[key] = value;
          } else {
            delete next[key];
          }
          return next;
        },
      });
    },
    [navigate],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      onFilterChange?.(key, value);
      syncToUrl(key, value);
    },
    [onFilterChange, syncToUrl],
  );

  const activeFilterCount = Object.values(filterValues).filter(Boolean).length;

  // Clear all filters
  const clearAll = useCallback(() => {
    for (const f of filters) handleFilterChange(f.key, "");
    onSearchChange("");
  }, [filters, handleFilterChange, onSearchChange]);

  const hasActiveState = searchValue.length > 0 || activeFilterCount > 0;

  // Keep search synced to URL
  useEffect(() => {
    syncToUrl("q", searchValue);
  }, [searchValue, syncToUrl]);

  return (
    <div className="space-y-2" data-ocid="search-filter-bar">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            data-ocid="search-input"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFilters((p) => !p)}
            data-ocid="filter-toggle"
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-input hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-primary-foreground/20 text-primary-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Clear all */}
        {hasActiveState && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/40 border border-border rounded-lg">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1 min-w-[140px]">
              <label
                htmlFor={`filter-${filter.key}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {filter.label}
              </label>
              <select
                id={`filter-${filter.key}`}
                value={filterValues[filter.key] ?? ""}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                data-ocid={`filter-${filter.key}`}
                className="h-8 px-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                <option value="">All {filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
