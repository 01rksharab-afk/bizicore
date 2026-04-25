import { PortalLayout } from "@/components/PortalLayout";
import { usePortalAuth } from "@/context/PortalAuthContext";
import {
  type PortalTask,
  type TaskStatus,
  usePortalTasks,
  usePortalUpdateTaskStatus,
} from "@/hooks/usePortal";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

// ─── Priority Badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: PortalTask["priority"] }) {
  const cls = {
    High: "task-priority-badge task-priority-high",
    Medium: "task-priority-badge task-priority-medium",
    Low: "task-priority-badge task-priority-low",
  }[priority];
  return <span className={cls}>{priority}</span>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const cls = cn(
    "inline-flex items-center px-2 py-1 rounded text-xs font-semibold",
    status === "Pending" && "bg-muted text-muted-foreground",
    status === "In Progress" &&
      "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    status === "Completed" &&
      "bg-green-500/10 text-green-700 dark:text-green-400",
  );
  return <span className={cls}>{status}</span>;
}

// ─── Due Date ─────────────────────────────────────────────────────────────────

function DueDate({ dueDate }: { dueDate: string }) {
  const date = new Date(dueDate);
  const isValid = !Number.isNaN(date.getTime());
  const isOverdue = isValid && date < new Date();
  const formatted = isValid
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : dueDate;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        isOverdue ? "text-destructive font-semibold" : "text-muted-foreground",
      )}
    >
      <CalendarClock className="size-3.5 flex-shrink-0" />
      Due: {formatted}
    </span>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  companyId,
}: { task: PortalTask; companyId: string }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = usePortalUpdateTaskStatus();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateStatus.mutate({
      id: task.id,
      companyId,
      status: e.target.value as TaskStatus,
    });
  }

  return (
    <div className="task-card fade-in" data-ocid={`task-card-${task.id}`}>
      <div className="task-card-header">
        <div className="flex-1 min-w-0">
          <p className="task-card-title truncate">{task.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-200 mt-0.5"
          aria-label={expanded ? "Collapse task" : "Expand task"}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
      </div>

      {/* Due date always visible */}
      <DueDate dueDate={task.dueDate} />

      {/* Expanded section */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}

          {task.fileUrl && (
            <a
              href={task.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
              data-ocid={`task-attachment-${task.id}`}
            >
              <ExternalLink className="size-3.5" />
              Download Attachment
            </a>
          )}

          <div className="flex items-center gap-2">
            <label
              htmlFor={`status-${task.id}`}
              className="text-sm font-medium text-foreground whitespace-nowrap"
            >
              Update status:
            </label>
            <select
              id={`status-${task.id}`}
              className="task-status-select flex-1 min-w-0"
              value={task.status}
              onChange={handleStatusChange}
              disabled={updateStatus.isPending}
              data-ocid={`task-status-select-${task.id}`}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inner content (requires valid employee session) ──────────────────────────

function DashboardContent({
  employeeId,
  companyId,
}: {
  employeeId: string;
  companyId: string;
}) {
  const { data: allTasks = [], isLoading } = usePortalTasks(companyId);
  const myTasks = allTasks.filter((t) => t.assignedTo === employeeId);
  const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          My Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {myTasks.length > 0
            ? `${myTasks.length} task${myTasks.length !== 1 ? "s" : ""} assigned to you`
            : "Your assigned work"}
        </p>
      </div>

      {myTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {STATUSES.map((s) => {
            const count = myTasks.filter((t) => t.status === s).length;
            return (
              <div
                key={s}
                className="bg-card border border-border rounded-lg p-3 text-center"
              >
                <p className="text-xl font-display font-bold text-foreground">
                  {count}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{s}</p>
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="employee-dashboard-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="task-card animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : myTasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="employee-tasks-empty"
        >
          <CheckSquare className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-display font-semibold text-foreground">
            No tasks assigned yet
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Your admin will assign tasks to you. Check back soon.
          </p>
        </div>
      ) : (
        <div className="employee-dashboard-grid">
          {myTasks.map((task) => (
            <TaskCard key={task.id} task={task} companyId={companyId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalEmployeeDashboardPage() {
  const { portalSession } = usePortalAuth();

  const employeeId =
    portalSession?.role === "portalEmployee" ? portalSession.employeeId : null;
  const companyId =
    portalSession?.role === "portalEmployee" ? portalSession.companyId : null;

  return (
    <PortalLayout requiredRole="portalEmployee">
      {employeeId && companyId ? (
        <DashboardContent employeeId={employeeId} companyId={companyId} />
      ) : null}
    </PortalLayout>
  );
}
