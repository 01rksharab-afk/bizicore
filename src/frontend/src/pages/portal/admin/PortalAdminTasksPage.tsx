import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { usePortalAuth } from "@/context/PortalAuthContext";
import {
  type PortalTask,
  type TaskPriority,
  type TaskStatus,
  usePortalCompanyId,
  usePortalCreateTask,
  usePortalDeleteTask,
  usePortalEmployees,
  usePortalTasks,
  usePortalUpdateTask,
} from "@/hooks/usePortal";
import {
  CheckCircle2,
  ClipboardList,
  Edit,
  Filter,
  Paperclip,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  High: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  Medium:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Low: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  "In Progress":
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Completed:
    "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
};

// ─── Task Form ─────────────────────────────────────────────────────────────────

interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string;
  priority: TaskPriority;
  dueDate: string;
  fileAttach: string;
}

const EMPTY_TASK: TaskFormData = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "Medium",
  dueDate: "",
  fileAttach: "",
};

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editing?: PortalTask | null;
  companyId: string;
}

function TaskModal({ open, onClose, editing, companyId }: TaskModalProps) {
  const { portalSession } = usePortalAuth();
  const { data: employees = [] } = usePortalEmployees(companyId);
  const createTask = usePortalCreateTask();
  const updateTask = usePortalUpdateTask();
  const adminId =
    portalSession?.role === "portalAdmin" ? portalSession.adminId : "";
  const activeEmps = employees.filter((e) => e.status === "active");

  const [form, setForm] = useState<TaskFormData>(
    editing
      ? {
          title: editing.title,
          description: editing.description,
          assignedTo: editing.assignedTo,
          priority: editing.priority,
          dueDate: editing.dueDate,
          fileAttach: editing.fileUrl ?? "",
        }
      : EMPTY_TASK,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof TaskFormData, string>>
  >({});

  const validate = (): boolean => {
    const errs: Partial<Record<keyof TaskFormData, string>> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.assignedTo) errs.assignedTo = "Assignee is required";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const emp = activeEmps.find((e) => e.employeeId === form.assignedTo);
    if (editing) {
      updateTask.mutate(
        {
          id: editing.id,
          companyId,
          title: form.title,
          description: form.description,
          assignedTo: form.assignedTo,
          assignedToName: emp?.name ?? form.assignedTo,
          priority: form.priority,
          dueDate: form.dueDate,
          fileUrl: form.fileAttach || undefined,
        },
        { onSuccess: onClose },
      );
    } else {
      createTask.mutate(
        {
          title: form.title,
          description: form.description,
          assignedTo: form.assignedTo,
          assignedToName: emp?.name ?? form.assignedTo,
          priority: form.priority,
          dueDate: form.dueDate,
          createdBy: adminId,
          companyId,
          fileUrl: form.fileAttach || undefined,
        },
        { onSuccess: onClose },
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg" data-ocid="task-modal">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Task title"
              data-ocid="task-title"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description *</Label>
            <Textarea
              id="task-desc"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe the task..."
              rows={3}
              data-ocid="task-desc"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assign To *</Label>
              <Select
                value={form.assignedTo}
                onValueChange={(v) => setForm((p) => ({ ...p, assignedTo: v }))}
              >
                <SelectTrigger id="task-assignee" data-ocid="task-assignee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmps.map((e) => (
                    <SelectItem key={e.employeeId} value={e.employeeId}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedTo && (
                <p className="text-xs text-destructive">{errors.assignedTo}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority *</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, priority: v as TaskPriority }))
                }
              >
                <SelectTrigger id="task-priority" data-ocid="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due Date *</Label>
              <Input
                id="task-due"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
                data-ocid="task-due"
              />
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-file">File Attachment (optional)</Label>
              <div className="relative">
                <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  id="task-file"
                  value={form.fileAttach}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fileAttach: e.target.value }))
                  }
                  placeholder="Paste file URL"
                  className="pl-9"
                  data-ocid="task-file"
                />
              </div>
            </div>
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editing.status}
                onValueChange={(v) => {
                  updateTask.mutate({
                    id: editing.id,
                    companyId,
                    status: v as TaskStatus,
                  });
                }}
              >
                <SelectTrigger data-ocid="task-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-ocid="task-submit"
          >
            {isPending ? "Saving..." : editing ? "Update Task" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PortalAdminTasksPage() {
  const companyId = usePortalCompanyId();
  const { data: tasks = [], isLoading } = usePortalTasks(companyId);
  const { data: employees = [] } = usePortalEmployees(companyId);
  const deleteTask = usePortalDeleteTask();

  const [search, setSearch] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PortalTask | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<PortalTask | null>(
    null,
  );

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterEmployee !== "all" && t.assignedTo !== filterEmployee)
      return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterDateFrom && t.dueDate < filterDateFrom) return false;
    if (filterDateTo && t.dueDate > filterDateTo) return false;
    return true;
  });

  const handleDelete = useCallback((task: PortalTask) => {
    setConfirmDeleteTask(task);
  }, []);

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };
  const openEdit = (task: PortalTask) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterEmployee("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasFilters =
    search ||
    filterEmployee !== "all" ||
    filterStatus !== "all" ||
    filterDateFrom ||
    filterDateTo;

  return (
    <PortalLayout requiredRole="portalAdmin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Task Assignment
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.filter((t) => t.status === "Pending").length} pending ·{" "}
            {tasks.filter((t) => t.status === "In Progress").length} in progress
            · {tasks.filter((t) => t.status === "Completed").length} completed
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="gap-2"
          data-ocid="create-task-btn"
        >
          <Plus className="size-3.5" /> Create Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="size-4 text-muted-foreground" />
          Filters
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-6 text-xs"
              data-ocid="tasks-clear-filters"
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
              data-ocid="tasks-search"
            />
          </div>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger
              className="h-8 text-sm"
              data-ocid="tasks-filter-employee"
            >
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.employeeId} value={e.employeeId}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}
          >
            <SelectTrigger
              className="h-8 text-sm"
              data-ocid="tasks-filter-status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="h-8 text-sm"
            placeholder="From date"
            data-ocid="tasks-filter-from"
          />
          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="h-8 text-sm"
            placeholder="To date"
            data-ocid="tasks-filter-to"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Title</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                (["r1", "r2", "r3", "r4", "r5"] as const).map((rowKey) => (
                  <TableRow key={rowKey}>
                    {(["c1", "c2", "c3", "c4", "c5", "c6"] as const).map(
                      (colKey) => (
                        <TableCell key={colKey}>
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {hasFilters
                          ? "No tasks match your filters"
                          : "No tasks yet. Create your first task."}
                      </p>
                      {!hasFilters && (
                        <Button
                          size="sm"
                          onClick={openCreate}
                          data-ocid="tasks-empty-create"
                        >
                          Create Task
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue =
                    dueDate &&
                    dueDate < new Date() &&
                    task.status !== "Completed";
                  return (
                    <TableRow
                      key={task.id}
                      className="hover:bg-muted/20"
                      data-ocid={`task-row-${task.id}`}
                    >
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium text-sm text-foreground truncate">
                            {task.title}
                          </p>
                          {task.fileUrl && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Paperclip className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">
                                Attachment
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                            {task.assignedToName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground">
                            {task.assignedToName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${STATUS_COLORS[task.status]}`}
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                        >
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                          {isOverdue && " ⚠"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEdit(task)}
                            aria-label="Edit task"
                            data-ocid={`edit-task-${task.id}`}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(task)}
                            aria-label="Delete task"
                            data-ocid={`delete-task-${task.id}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {tasks.length} tasks
            </p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {companyId && (
        <TaskModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editingTask}
          companyId={companyId}
        />
      )}

      {/* Inline Delete Confirmation */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="text-base font-display font-semibold text-foreground">
              Delete task?
            </h2>
            <p className="text-sm text-muted-foreground">
              "{confirmDeleteTask.title}" will be permanently deleted. This
              cannot be undone.
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDeleteTask(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (companyId) {
                    deleteTask.mutate({
                      id: confirmDeleteTask.id,
                      companyId,
                    });
                  }
                  setConfirmDeleteTask(null);
                }}
                data-ocid="confirm-delete-task"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
