// Accounting Masters module removed — hooks no longer available.
import type { OrgId } from "@/backend";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useChartOfAccounts(_orgId: OrgId | null) {
  return useQuery({ queryKey: ["chartOfAccounts"], queryFn: async () => [] });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCreateChartOfAccount(_orgId: OrgId | null) {
  return { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useUpdateChartOfAccount(_orgId: OrgId | null) {
  return { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useDeleteChartOfAccount(_orgId: OrgId | null) {
  return { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useJournalVouchers(_orgId: OrgId | null) {
  return useQuery({ queryKey: ["journalVouchers"], queryFn: async () => [] });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCreateJournalVoucher(_orgId: OrgId | null) {
  return { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePostJournalVoucher(_orgId: OrgId | null) {
  return { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useLedgerPostings(_orgId: OrgId | null) {
  return useQuery({ queryKey: ["ledgerPostings"], queryFn: async () => [] });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCreateLedgerPosting(_orgId: OrgId | null) {
  return { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAccountLedger(_orgId: OrgId | null, _accountId?: bigint) {
  return useQuery({ queryKey: ["accountLedger"], queryFn: async () => [] });
}
