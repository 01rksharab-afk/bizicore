import type {
  BulkImportResult,
  Category,
  CategoryId,
  CreateCategoryInput,
  CreateProductInput,
  OrgId,
  Product,
  ProductId,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Categories ────────────────────────────────────────────────────────────────

export function useCategories(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Category[]>({
    queryKey: ["categories", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      const result = await actor.listCategories(orgId);
      if (result.__kind__ === "ok") return result.ok;
      return [];
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useCreateCategory(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.createCategory(input);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error("Not authorized");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", orgId?.toString()] });
      toast.success("Category created successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create category");
    },
  });
}

export function useUpdateCategory(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.updateCategory(input);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error(
        result.__kind__ === "notFound"
          ? "Category not found"
          : "Not authorized",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", orgId?.toString()] });
      toast.success("Category updated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update category");
    },
  });
}

export function useDeleteCategory(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: CategoryId) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.deleteCategory(orgId, categoryId);
      if (result === "ok") return true;
      throw new Error(
        result === "notFound" ? "Category not found" : "Not authorized",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", orgId?.toString()] });
      toast.success("Category deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete category");
    },
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

export function useProducts(orgId: OrgId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Product[]>({
    queryKey: ["products", orgId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      const result = await actor.listProducts(orgId);
      if (result.__kind__ === "ok") return result.ok;
      return [];
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useProduct(orgId: OrgId | null, productId: ProductId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Product | null>({
    queryKey: ["product", orgId?.toString(), productId?.toString()],
    queryFn: async () => {
      if (!actor || !orgId || !productId) return null;
      const result = await actor.getProduct(orgId, productId);
      if (result.__kind__ === "ok") return result.ok;
      return null;
    },
    enabled: !!actor && !isFetching && !!orgId && !!productId,
  });
}

export function useCreateProduct(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.createProduct(input);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error("Not authorized");
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["products", orgId?.toString()] });
      // Cache single product immediately
      qc.setQueryData(["product", orgId?.toString(), data.id.toString()], data);
      toast.success("Product created successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create product");
    },
  });
}

export function useUpdateProduct(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.updateProduct(input);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error(
        result.__kind__ === "notFound" ? "Product not found" : "Not authorized",
      );
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["products", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["product", orgId?.toString(), input.id.toString()],
      });
      toast.success("Product updated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update product");
    },
  });
}

export function useDeleteProduct(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: ProductId) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.deleteProduct(orgId, productId);
      if (result === "ok") return true;
      throw new Error(
        result === "notFound" ? "Product not found" : "Not authorized",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId?.toString()] });
      toast.success("Product deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete product");
    },
  });
}

export function useBulkImportProducts(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<BulkImportResult, Error, CreateProductInput[]>({
    mutationFn: async (inputs: CreateProductInput[]) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const result = await actor.bulkImportProducts(inputs);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error("Not authorized");
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["products", orgId?.toString()] });
      const count = Number(data.successCount);
      if (count > 0) {
        toast.success(
          `${count} product${count !== 1 ? "s" : ""} imported successfully`,
        );
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Bulk import failed");
    },
  });
}

export function useDeductStock(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      qty,
    }: { productId: ProductId; qty: bigint }) => {
      if (!actor || !orgId) throw new Error("No actor/org");
      const ok = await actor.deductProductStock(productId, orgId, qty);
      if (!ok) throw new Error("Insufficient stock or product not found");
      return ok;
    },
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: ["products", orgId?.toString()] });
      qc.invalidateQueries({
        queryKey: ["product", orgId?.toString(), productId.toString()],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to deduct stock");
    },
  });
}

// ── Search ────────────────────────────────────────────────────────────────────

export function useSearchByHsn(orgId: OrgId | null, prefix: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Product[]>({
    queryKey: ["hsn-search", orgId?.toString(), prefix],
    queryFn: async () => {
      if (!actor || !orgId || !prefix.trim()) return [];
      return actor.searchByHsn(orgId, prefix.trim());
    },
    enabled: !!actor && !isFetching && !!orgId && prefix.trim().length > 0,
    staleTime: 30_000,
  });
}

export function useSearchByPartNumber(orgId: OrgId | null, prefix: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Product[]>({
    queryKey: ["part-search", orgId?.toString(), prefix],
    queryFn: async () => {
      if (!actor || !orgId || !prefix.trim()) return [];
      return actor.searchByPartNumber(orgId, prefix.trim());
    },
    enabled: !!actor && !isFetching && !!orgId && prefix.trim().length > 0,
    staleTime: 30_000,
  });
}

/** Imperative search functions for on-demand queries (not React Query) */
export function useProductSearch(orgId: OrgId | null) {
  const { actor } = useBackendActor();
  return {
    searchByHsn: async (prefix: string): Promise<Product[]> => {
      if (!actor || !orgId) return [];
      return actor.searchByHsn(orgId, prefix);
    },
    searchByPartNumber: async (prefix: string): Promise<Product[]> => {
      if (!actor || !orgId) return [];
      return actor.searchByPartNumber(orgId, prefix);
    },
  };
}
