import type { Product } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchByHsn, useSearchByPartNumber } from "@/hooks/useInventory";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Hash, Package, Search, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SearchMode = "hsn" | "part";

function ProductRow({ product }: { product: Product }) {
  return (
    <Link
      to="/inventory/$productId"
      params={{ productId: product.id.toString() }}
      className="block"
    >
      <div
        className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer group"
        data-ocid="search-result-row"
      >
        <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Package className="size-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {product.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0 space-y-1">
          {product.hsnCode && (
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground justify-end">
              <Hash className="size-3" />
              {product.hsnCode}
            </div>
          )}
          {product.partNumber && (
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground justify-end">
              <Tag className="size-3" />
              {product.partNumber}
            </div>
          )}
          <p className="text-sm font-semibold text-foreground">
            ₹{product.rate.toLocaleString("en-IN")}
          </p>
          <Badge variant="outline" className="text-xs">
            {product.taxPercent.toString()}% GST
          </Badge>
        </div>
      </div>
    </Link>
  );
}

export default function HsnSearchPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;

  const [mode, setMode] = useState<SearchMode>("hsn");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const hsnResults = useSearchByHsn(
    mode === "hsn" ? orgId : null,
    mode === "hsn" ? debouncedQuery : "",
  );
  const partResults = useSearchByPartNumber(
    mode === "part" ? orgId : null,
    mode === "part" ? debouncedQuery : "",
  );

  const activeQuery = mode === "hsn" ? hsnResults : partResults;
  const results: Product[] = activeQuery.data ?? [];
  const isLoading = activeQuery.isFetching && debouncedQuery.trim().length > 0;
  const hasSearched = debouncedQuery.trim().length > 0;

  const handleModeSwitch = (newMode: SearchMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setQuery("");
      setDebouncedQuery("");
    }
  };

  return (
    <SubscriptionGate requiredPlan="pro" feature="HSN & Part Number Search">
      <div className="space-y-6 max-w-3xl fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              HSN &amp; Part Number Search
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Find products by HSN code or part number prefix — results update
              as you type
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex p-1 bg-muted rounded-lg w-fit gap-1">
          <button
            type="button"
            onClick={() => handleModeSwitch("hsn")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              mode === "hsn"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="hsn-mode-tab"
          >
            <Hash className="size-4" />
            HSN Code
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("part")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              mode === "part"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="part-mode-tab"
          >
            <Tag className="size-4" />
            Part Number
          </button>
        </div>

        {/* Search input */}
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-10 h-11"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "hsn"
                  ? "Enter HSN code prefix (e.g. 7306, 8471)…"
                  : "Enter part number prefix (e.g. PIPE-001, SKU)…"
              }
              data-ocid={
                mode === "hsn" ? "hsn-search-input" : "part-search-input"
              }
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "hsn"
              ? "Entering '73' matches all products with HSN codes starting with 73"
              : "Entering 'PIPE' matches PIPE-001, PIPE-002, etc."}
          </p>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-2">
            {["sk-s1", "sk-s2", "sk-s3"].map((key) => (
              <Skeleton key={key} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2 fade-in">
            <p className="text-xs text-muted-foreground mb-1">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {results.map((p) => (
              <ProductRow key={p.id.toString()} product={p} />
            ))}
          </div>
        ) : hasSearched && !isLoading ? (
          <Card>
            <CardContent
              className="py-12 text-center"
              data-ocid={mode === "hsn" ? "hsn-no-results" : "part-no-results"}
            >
              <Package className="size-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-foreground text-sm">
                No products found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No products match {mode === "hsn" ? "HSN code" : "part number"}{" "}
                prefix "<span className="font-mono">{debouncedQuery}</span>"
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Search className="size-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Start typing a {mode === "hsn" ? "HSN code" : "part number"}{" "}
                prefix above
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SubscriptionGate>
  );
}
