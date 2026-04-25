import { usePortalAuth } from "@/context/PortalAuthContext";
import type {
  PortalAdminSession,
  PortalCompany,
  PortalEmployeeSession,
} from "@/context/PortalAuthContext";
/**
 * Portal hooks — wraps all portal operations using React Query.
 * Since the backend doesn't expose portal-specific actor methods,
 * we use localStorage + simulated async operations to persist data per session.
 * Admin sessions store their employees/tasks/layouts under a company-scoped key.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface PortalEmployee {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  loginPassword: string;
  companyId: string;
  status: "active" | "inactive";
  permissions: string[];
  createdAt: string;
}

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "In Progress" | "Completed";

export interface PortalTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string; // employeeId
  assignedToName: string;
  createdBy: string; // adminId
  companyId: string;
  fileUrl?: string;
  createdAt: string;
}

export interface PortalNotification {
  id: string;
  message: string;
  recipientEmployeeId: string;
  companyId: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardWidget {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type:
    | "members"
    | "tasks-overview"
    | "activity"
    | "deadlines"
    | "department-breakdown"
    | "quick-add-task"
    | "quick-add-employee";
  title: string;
}

export interface PortalDashboardLayout {
  adminId: string;
  widgets: DashboardWidget[];
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function storageKey(scope: string, companyId: string) {
  return `portal:${scope}:${companyId}`;
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function genEmployeeId(): string {
  return `EMP${Math.floor(10000 + Math.random() * 90000)}`;
}

// ─── Registration ─────────────────────────────────────────────────────────────

interface RegisterCompanyInput {
  companyName: string;
  companyType: string;
  gst?: string;
  industry: string;
  website?: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  adminName: string;
  adminDesignation: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  logoFile?: File;
}

interface RegisterGroupInput {
  groupName: string;
  groupType: string;
  groupDescription: string;
  groupHeadName: string;
  contactEmail: string;
  phone: string;
  password: string;
}

interface RegisterIndividualInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  photoFile?: File;
}

export function usePortalRegisterCompany() {
  return useMutation({
    mutationFn: async (
      input: RegisterCompanyInput,
    ): Promise<PortalAdminSession> => {
      await new Promise((r) => setTimeout(r, 600));
      const companyId = genId();
      const adminId = genId();
      const company: PortalCompany = {
        id: companyId,
        name: input.companyName,
        type: input.companyType,
      };
      // Store admin credentials
      const adminCreds = readStore<
        Record<string, { password: string; adminId: string; companyId: string }>
      >("portal:admin-creds", {});
      adminCreds[input.adminEmail.toLowerCase()] = {
        password: input.password,
        adminId,
        companyId,
      };
      writeStore("portal:admin-creds", adminCreds);

      // Store company data
      const companies = readStore<Record<string, PortalCompany>>(
        "portal:companies",
        {},
      );
      companies[companyId] = company;
      writeStore("portal:companies", companies);

      // Store admin profile
      const admins = readStore<
        Record<string, { name: string; designation: string; email: string }>
      >("portal:admins", {});
      admins[adminId] = {
        name: input.adminName,
        designation: input.adminDesignation,
        email: input.adminEmail,
      };
      writeStore("portal:admins", admins);

      return {
        role: "portalAdmin",
        adminId,
        name: input.adminName,
        email: input.adminEmail,
        designation: input.adminDesignation,
        company,
      };
    },
    onSuccess: () => toast.success("Company registered successfully!"),
    onError: (e: Error) => toast.error(e.message ?? "Registration failed"),
  });
}

export function usePortalRegisterGroup() {
  return useMutation({
    mutationFn: async (
      input: RegisterGroupInput,
    ): Promise<PortalAdminSession> => {
      await new Promise((r) => setTimeout(r, 600));
      const companyId = genId();
      const adminId = genId();
      const company: PortalCompany = {
        id: companyId,
        name: input.groupName,
        type: input.groupType,
      };
      const adminCreds = readStore<
        Record<string, { password: string; adminId: string; companyId: string }>
      >("portal:admin-creds", {});
      adminCreds[input.contactEmail.toLowerCase()] = {
        password: input.password,
        adminId,
        companyId,
      };
      writeStore("portal:admin-creds", adminCreds);

      const companies = readStore<Record<string, PortalCompany>>(
        "portal:companies",
        {},
      );
      companies[companyId] = company;
      writeStore("portal:companies", companies);

      const admins = readStore<
        Record<string, { name: string; designation: string; email: string }>
      >("portal:admins", {});
      admins[adminId] = {
        name: input.groupHeadName,
        designation: "Group Head",
        email: input.contactEmail,
      };
      writeStore("portal:admins", admins);

      return {
        role: "portalAdmin",
        adminId,
        name: input.groupHeadName,
        email: input.contactEmail,
        designation: "Group Head",
        company,
      };
    },
    onSuccess: () => toast.success("Group registered successfully!"),
    onError: (e: Error) => toast.error(e.message ?? "Registration failed"),
  });
}

export function usePortalRegisterIndividual() {
  return useMutation({
    mutationFn: async (
      input: RegisterIndividualInput,
    ): Promise<PortalAdminSession> => {
      await new Promise((r) => setTimeout(r, 600));
      const companyId = genId();
      const adminId = genId();
      const company: PortalCompany = {
        id: companyId,
        name: input.fullName,
        type: "Individual",
      };
      const adminCreds = readStore<
        Record<string, { password: string; adminId: string; companyId: string }>
      >("portal:admin-creds", {});
      adminCreds[input.email.toLowerCase()] = {
        password: input.password,
        adminId,
        companyId,
      };
      writeStore("portal:admin-creds", adminCreds);

      const companies = readStore<Record<string, PortalCompany>>(
        "portal:companies",
        {},
      );
      companies[companyId] = company;
      writeStore("portal:companies", companies);

      const admins = readStore<
        Record<string, { name: string; designation: string; email: string }>
      >("portal:admins", {});
      admins[adminId] = {
        name: input.fullName,
        designation: "Individual",
        email: input.email,
      };
      writeStore("portal:admins", admins);

      return {
        role: "portalAdmin",
        adminId,
        name: input.fullName,
        email: input.email,
        designation: "Individual",
        company,
      };
    },
    onSuccess: () => toast.success("Account created successfully!"),
    onError: (e: Error) => toast.error(e.message ?? "Registration failed"),
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────

export function usePortalLoginAdmin() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<PortalAdminSession> => {
      await new Promise((r) => setTimeout(r, 500));
      const adminCreds = readStore<
        Record<string, { password: string; adminId: string; companyId: string }>
      >("portal:admin-creds", {});
      const cred = adminCreds[email.toLowerCase()];
      if (!cred || cred.password !== password) {
        throw new Error("Invalid email or password");
      }
      const companies = readStore<Record<string, PortalCompany>>(
        "portal:companies",
        {},
      );
      const admins = readStore<
        Record<string, { name: string; designation: string; email: string }>
      >("portal:admins", {});
      const company = companies[cred.companyId];
      const admin = admins[cred.adminId];
      if (!company || !admin) throw new Error("Account data not found");

      return {
        role: "portalAdmin",
        adminId: cred.adminId,
        name: admin.name,
        email: admin.email,
        designation: admin.designation,
        company,
      };
    },
    onSuccess: () => toast.success("Logged in as Admin"),
    onError: (e: Error) => toast.error(e.message ?? "Login failed"),
  });
}

export function usePortalLoginEmployee() {
  return useMutation({
    mutationFn: async ({
      employeeId,
      password,
    }: {
      employeeId: string;
      password: string;
    }): Promise<PortalEmployeeSession> => {
      await new Promise((r) => setTimeout(r, 500));
      // Search all companies for matching employee
      const companies = readStore<Record<string, PortalCompany>>(
        "portal:companies",
        {},
      );
      for (const company of Object.values(companies)) {
        const employees = readStore<PortalEmployee[]>(
          storageKey("employees", company.id),
          [],
        );
        const emp = employees.find(
          (e) =>
            e.employeeId === employeeId &&
            e.loginPassword === password &&
            e.status === "active",
        );
        if (emp) {
          return {
            role: "portalEmployee",
            employeeId: emp.employeeId,
            name: emp.name,
            designation: emp.designation,
            department: emp.department,
            companyId: emp.companyId,
            companyName: company.name,
            permissions: emp.permissions,
          };
        }
      }
      throw new Error("Invalid Employee ID or password");
    },
    onSuccess: () => toast.success("Logged in as Employee"),
    onError: (e: Error) => toast.error(e.message ?? "Login failed"),
  });
}

// ─── Employee Management ─────────────────────────────────────────────────────

export function usePortalEmployees(companyId: string | undefined) {
  return useQuery<PortalEmployee[]>({
    queryKey: ["portal-employees", companyId],
    queryFn: () => {
      if (!companyId) return [];
      return readStore<PortalEmployee[]>(
        storageKey("employees", companyId),
        [],
      );
    },
    enabled: !!companyId,
  });
}

export function usePortalCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PortalEmployee, "id" | "employeeId" | "createdAt" | "status">,
    ): Promise<PortalEmployee> => {
      await new Promise((r) => setTimeout(r, 400));
      const employees = readStore<PortalEmployee[]>(
        storageKey("employees", input.companyId),
        [],
      );
      const newEmp: PortalEmployee = {
        ...input,
        id: genId(),
        employeeId: genEmployeeId(),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      writeStore(storageKey("employees", input.companyId), [
        ...employees,
        newEmp,
      ]);
      return newEmp;
    },
    onSuccess: (data) => {
      toast.success(`Employee ${data.name} added (ID: ${data.employeeId})`);
      qc.invalidateQueries({ queryKey: ["portal-employees", data.companyId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to add employee"),
  });
}

export function usePortalUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<PortalEmployee> & { id: string; companyId: string },
    ): Promise<PortalEmployee> => {
      await new Promise((r) => setTimeout(r, 400));
      const employees = readStore<PortalEmployee[]>(
        storageKey("employees", input.companyId),
        [],
      );
      const idx = employees.findIndex((e) => e.id === input.id);
      if (idx === -1) throw new Error("Employee not found");
      const updated = { ...employees[idx], ...input };
      employees[idx] = updated;
      writeStore(storageKey("employees", input.companyId), employees);
      return updated;
    },
    onSuccess: (data) => {
      toast.success("Employee updated");
      qc.invalidateQueries({ queryKey: ["portal-employees", data.companyId] });
    },
    onError: (e: Error) =>
      toast.error(e.message ?? "Failed to update employee"),
  });
}

export function usePortalDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      companyId,
    }: {
      id: string;
      companyId: string;
    }): Promise<void> => {
      await new Promise((r) => setTimeout(r, 300));
      const employees = readStore<PortalEmployee[]>(
        storageKey("employees", companyId),
        [],
      );
      const idx = employees.findIndex((e) => e.id === id);
      if (idx !== -1) {
        employees[idx].status = "inactive";
        writeStore(storageKey("employees", companyId), employees);
      }
    },
    onSuccess: (_, vars) => {
      toast.success("Employee deactivated");
      qc.invalidateQueries({
        queryKey: ["portal-employees", vars.companyId],
      });
    },
    onError: (e: Error) =>
      toast.error(e.message ?? "Failed to deactivate employee"),
  });
}

// ─── Task Management ──────────────────────────────────────────────────────────

export function usePortalTasks(companyId: string | undefined) {
  return useQuery<PortalTask[]>({
    queryKey: ["portal-tasks", companyId],
    queryFn: () => {
      if (!companyId) return [];
      return readStore<PortalTask[]>(storageKey("tasks", companyId), []);
    },
    enabled: !!companyId,
  });
}

export function usePortalCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PortalTask, "id" | "createdAt" | "status">,
    ): Promise<PortalTask> => {
      await new Promise((r) => setTimeout(r, 400));
      const tasks = readStore<PortalTask[]>(
        storageKey("tasks", input.companyId),
        [],
      );
      const task: PortalTask = {
        ...input,
        id: genId(),
        status: "Pending",
        createdAt: new Date().toISOString(),
      };
      writeStore(storageKey("tasks", input.companyId), [...tasks, task]);
      return task;
    },
    onSuccess: (data) => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["portal-tasks", data.companyId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to create task"),
  });
}

export function usePortalUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<PortalTask> & { id: string; companyId: string },
    ): Promise<PortalTask> => {
      await new Promise((r) => setTimeout(r, 400));
      const tasks = readStore<PortalTask[]>(
        storageKey("tasks", input.companyId),
        [],
      );
      const idx = tasks.findIndex((t) => t.id === input.id);
      if (idx === -1) throw new Error("Task not found");
      const updated = { ...tasks[idx], ...input };
      tasks[idx] = updated;
      writeStore(storageKey("tasks", input.companyId), tasks);
      return updated;
    },
    onSuccess: (data) => {
      toast.success("Task updated");
      qc.invalidateQueries({ queryKey: ["portal-tasks", data.companyId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to update task"),
  });
}

export function usePortalUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      companyId,
      status,
    }: {
      id: string;
      companyId: string;
      status: TaskStatus;
    }): Promise<void> => {
      await new Promise((r) => setTimeout(r, 300));
      const tasks = readStore<PortalTask[]>(storageKey("tasks", companyId), []);
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        tasks[idx].status = status;
        writeStore(storageKey("tasks", companyId), tasks);
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`Status updated to ${vars.status}`);
      qc.invalidateQueries({ queryKey: ["portal-tasks", vars.companyId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to update status"),
  });
}

export function usePortalDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      companyId,
    }: {
      id: string;
      companyId: string;
    }): Promise<void> => {
      await new Promise((r) => setTimeout(r, 300));
      const tasks = readStore<PortalTask[]>(storageKey("tasks", companyId), []);
      writeStore(
        storageKey("tasks", companyId),
        tasks.filter((t) => t.id !== id),
      );
    },
    onSuccess: (_, vars) => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["portal-tasks", vars.companyId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to delete task"),
  });
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    i: "members",
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    type: "members",
    title: "Total Members",
  },
  {
    i: "tasks-overview",
    x: 1,
    y: 0,
    w: 2,
    h: 2,
    type: "tasks-overview",
    title: "Tasks Overview",
  },
  {
    i: "activity",
    x: 3,
    y: 0,
    w: 1,
    h: 2,
    type: "activity",
    title: "Recent Activity",
  },
  {
    i: "deadlines",
    x: 0,
    y: 1,
    w: 1,
    h: 1,
    type: "deadlines",
    title: "Upcoming Deadlines",
  },
  {
    i: "department-breakdown",
    x: 0,
    y: 2,
    w: 2,
    h: 2,
    type: "department-breakdown",
    title: "Department Breakdown",
  },
  {
    i: "quick-add-task",
    x: 2,
    y: 2,
    w: 1,
    h: 1,
    type: "quick-add-task",
    title: "Quick Add Task",
  },
  {
    i: "quick-add-employee",
    x: 3,
    y: 2,
    w: 1,
    h: 1,
    type: "quick-add-employee",
    title: "Quick Add Employee",
  },
];

export function usePortalDashboardLayout(adminId: string | undefined) {
  return useQuery<DashboardWidget[]>({
    queryKey: ["portal-layout", adminId],
    queryFn: () => {
      if (!adminId) return DEFAULT_WIDGETS;
      return readStore<DashboardWidget[]>(
        `portal:layout:${adminId}`,
        DEFAULT_WIDGETS,
      );
    },
    enabled: !!adminId,
  });
}

export function usePortalSaveDashboardLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminId,
      widgets,
    }: {
      adminId: string;
      widgets: DashboardWidget[];
    }): Promise<void> => {
      await new Promise((r) => setTimeout(r, 200));
      writeStore(`portal:layout:${adminId}`, widgets);
    },
    onSuccess: (_, vars) => {
      toast.success("Dashboard layout saved");
      qc.invalidateQueries({ queryKey: ["portal-layout", vars.adminId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to save layout"),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function usePortalNotifications(
  companyId: string | undefined,
  recipientEmployeeId?: string,
) {
  return useQuery<PortalNotification[]>({
    queryKey: ["portal-notifications", companyId, recipientEmployeeId],
    queryFn: () => {
      if (!companyId) return [];
      const all = readStore<PortalNotification[]>(
        storageKey("notifications", companyId),
        [],
      );
      if (recipientEmployeeId) {
        return all.filter(
          (n) =>
            n.recipientEmployeeId === recipientEmployeeId ||
            n.recipientEmployeeId === "all",
        );
      }
      return all;
    },
    enabled: !!companyId,
  });
}

export function usePortalCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PortalNotification, "id" | "isRead" | "createdAt">,
    ): Promise<PortalNotification> => {
      await new Promise((r) => setTimeout(r, 300));
      const notifications = readStore<PortalNotification[]>(
        storageKey("notifications", input.companyId),
        [],
      );
      const notification: PortalNotification = {
        ...input,
        id: genId(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      writeStore(storageKey("notifications", input.companyId), [
        ...notifications,
        notification,
      ]);
      return notification;
    },
    onSuccess: (data) => {
      toast.success("Notification sent");
      qc.invalidateQueries({
        queryKey: ["portal-notifications", data.companyId],
      });
    },
    onError: (e: Error) =>
      toast.error(e.message ?? "Failed to send notification"),
  });
}

export function usePortalMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      companyId,
    }: {
      id: string;
      companyId: string;
    }): Promise<void> => {
      const notifications = readStore<PortalNotification[]>(
        storageKey("notifications", companyId),
        [],
      );
      const idx = notifications.findIndex((n) => n.id === id);
      if (idx !== -1) {
        notifications[idx].isRead = true;
        writeStore(storageKey("notifications", companyId), notifications);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["portal-notifications", vars.companyId],
      });
    },
  });
}

// ─── Employee Password Change ─────────────────────────────────────────────────

export function usePortalChangeEmployeePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      companyId,
      currentPassword,
      newPassword,
    }: {
      employeeId: string;
      companyId: string;
      currentPassword: string;
      newPassword: string;
    }): Promise<void> => {
      await new Promise((r) => setTimeout(r, 400));
      const employees = readStore<PortalEmployee[]>(
        storageKey("employees", companyId),
        [],
      );
      const idx = employees.findIndex((e) => e.employeeId === employeeId);
      if (idx === -1) throw new Error("Employee not found");
      if (employees[idx].loginPassword !== currentPassword) {
        throw new Error("Current password is incorrect");
      }
      employees[idx].loginPassword = newPassword;
      writeStore(storageKey("employees", companyId), employees);
    },
    onSuccess: (_, vars) => {
      toast.success("Password updated successfully");
      qc.invalidateQueries({ queryKey: ["portal-employees", vars.companyId] });
    },
    onError: (e: Error) =>
      toast.error(e.message ?? "Failed to update password"),
  });
}

// ─── Convenience hook ─────────────────────────────────────────────────────────

export function usePortalCompanyId(): string | undefined {
  const { portalSession } = usePortalAuth();
  if (!portalSession) return undefined;
  if (portalSession.role === "portalAdmin") return portalSession.company.id;
  return portalSession.companyId;
}
