import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePortalAuth } from "@/context/PortalAuthContext";
import {
  type DashboardWidget,
  usePortalCompanyId,
  usePortalCreateEmployee,
  usePortalCreateTask,
  usePortalDashboardLayout,
  usePortalEmployees,
  usePortalSaveDashboardLayout,
  usePortalTasks,
} from "@/hooks/usePortal";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  GripVertical,
  Layout,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import {
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ─── Widget type metadata ──────────────────────────────────────────────────────

const WIDGET_META: Record<
  DashboardWidget["type"],
  { icon: React.ElementType; label: string; desc: string }
> = {
  members: {
    icon: Users,
    label: "Total Members",
    desc: "Count of team members",
  },
  "tasks-overview": {
    icon: PieChart,
    label: "Tasks Overview",
    desc: "Pie chart of task statuses",
  },
  activity: {
    icon: Clock,
    label: "Recent Activity",
    desc: "Last 10 task changes",
  },
  deadlines: {
    icon: AlertTriangle,
    label: "Upcoming Deadlines",
    desc: "Tasks due in 7 days",
  },
  "department-breakdown": {
    icon: BarChart3,
    label: "Department Breakdown",
    desc: "Tasks per department",
  },
  "quick-add-task": {
    icon: Zap,
    label: "Quick Add Task",
    desc: "Create a task fast",
  },
  "quick-add-employee": {
    icon: Plus,
    label: "Quick Add Employee",
    desc: "Add a team member fast",
  },
};

const DEFAULT_LAYOUT: DashboardWidget[] = [
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

// ─── Widget components ─────────────────────────────────────────────────────────

function TotalMembersWidget({ companyId }: { companyId: string }) {
  const { data: employees = [] } = usePortalEmployees(companyId);
  const active = employees.filter((e) => e.status === "active").length;
  return (
    <div className="flex flex-col h-full justify-center items-center gap-2 py-4">
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Users className="size-8 text-primary" />
      </div>
      <div className="text-4xl font-display font-bold text-foreground">
        {active}
      </div>
      <div className="text-sm text-muted-foreground">Active Members</div>
      <div className="text-xs text-muted-foreground">
        {employees.length} total
      </div>
    </div>
  );
}

function TasksOverviewWidget({ companyId }: { companyId: string }) {
  const { data: tasks = [] } = usePortalTasks(companyId);
  const counts = {
    Pending: tasks.filter((t) => t.status === "Pending").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    Completed: tasks.filter((t) => t.status === "Completed").length,
  };
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const COLORS = ["#94a3b8", "#3b82f6", "#22c55e"];
  return (
    <div className="h-full flex flex-col">
      <ResponsiveContainer width="100%" height={160}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={60}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
            fontSize={11}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPie>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 text-xs mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1">
            <div
              className="size-2 rounded-full"
              style={{ background: COLORS[i] }}
            />
            <span className="text-muted-foreground">
              {d.name}: <b className="text-foreground">{d.value}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivityWidget({ companyId }: { companyId: string }) {
  const { data: tasks = [] } = usePortalTasks(companyId);
  const recent = [...tasks]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  return (
    <div className="space-y-2 overflow-y-auto h-full pr-1">
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No activity yet
        </p>
      ) : (
        recent.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 py-1.5 border-b border-border last:border-0"
          >
            <div
              className={`size-2 rounded-full mt-1.5 flex-shrink-0 ${t.status === "Completed" ? "bg-green-500" : t.status === "In Progress" ? "bg-blue-500" : "bg-muted-foreground"}`}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {t.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.assignedToName} · {t.status}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function UpcomingDeadlinesWidget({ companyId }: { companyId: string }) {
  const { data: tasks = [] } = usePortalTasks(companyId);
  const today = new Date();
  const next7 = new Date(today);
  next7.setDate(today.getDate() + 7);
  const upcoming = tasks
    .filter(
      (t) =>
        t.status !== "Completed" && t.dueDate && new Date(t.dueDate) <= next7,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);
  return (
    <div className="space-y-2 overflow-y-auto h-full">
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No upcoming deadlines
        </p>
      ) : (
        upcoming.map((t) => {
          const due = new Date(t.dueDate);
          const daysLeft = Math.ceil(
            (due.getTime() - today.getTime()) / 86400000,
          );
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 py-1 border-b border-border last:border-0"
            >
              <AlertTriangle
                className={`size-3 flex-shrink-0 ${daysLeft <= 1 ? "text-destructive" : "text-amber-500"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.assignedToName}
                </p>
              </div>
              <Badge
                variant={daysLeft <= 1 ? "destructive" : "secondary"}
                className="text-xs flex-shrink-0"
              >
                {daysLeft <= 0 ? "Overdue" : `${daysLeft}d`}
              </Badge>
            </div>
          );
        })
      )}
    </div>
  );
}

function DepartmentTasksWidget({ companyId }: { companyId: string }) {
  const { data: tasks = [] } = usePortalTasks(companyId);
  const { data: employees = [] } = usePortalEmployees(companyId);
  const deptMap: Record<string, number> = {};
  for (const task of tasks) {
    const emp = employees.find((e) => e.employeeId === task.assignedTo);
    const dept = emp?.department ?? "Unknown";
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  }
  const data = Object.entries(deptMap).map(([name, tasks]) => ({
    name,
    tasks,
  }));
  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No task data yet
      </p>
    );
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar
          dataKey="tasks"
          fill="oklch(0.42 0.14 240)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function QuickAddTaskWidget({ companyId }: { companyId: string }) {
  const { data: employees = [] } = usePortalEmployees(companyId);
  const { portalSession } = usePortalAuth();
  const createTask = usePortalCreateTask();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("");
  const activeEmps = employees.filter((e) => e.status === "active");
  const adminId =
    portalSession?.role === "portalAdmin" ? portalSession.adminId : "";

  const handleSubmit = () => {
    if (!title.trim() || !assignee || !due) {
      toast.error("Fill all required fields");
      return;
    }
    const emp = activeEmps.find((e) => e.employeeId === assignee);
    createTask.mutate(
      {
        title: title.trim(),
        description: "",
        priority: priority as "High" | "Medium" | "Low",
        dueDate: due,
        assignedTo: assignee,
        assignedToName: emp?.name ?? assignee,
        createdBy: adminId,
        companyId,
      },
      {
        onSuccess: () => {
          setTitle("");
          setAssignee("");
          setDue("");
        },
      },
    );
  };

  return (
    <div className="space-y-2 h-full flex flex-col justify-between">
      <div className="space-y-2">
        <Input
          placeholder="Task title*"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xs h-8"
        />
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Assign to*" />
          </SelectTrigger>
          <SelectContent>
            {activeEmps.map((e) => (
              <SelectItem
                key={e.employeeId}
                value={e.employeeId}
                className="text-xs"
              >
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High" className="text-xs">
                High
              </SelectItem>
              <SelectItem value="Medium" className="text-xs">
                Medium
              </SelectItem>
              <SelectItem value="Low" className="text-xs">
                Low
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="text-xs h-8 flex-1"
          />
        </div>
      </div>
      <Button
        size="sm"
        className="w-full h-8 text-xs"
        onClick={handleSubmit}
        disabled={createTask.isPending}
        data-ocid="widget-quick-add-task"
      >
        {createTask.isPending ? "Creating..." : "Create Task"}
      </Button>
    </div>
  );
}

function QuickAddEmployeeWidget({ companyId }: { companyId: string }) {
  const createEmployee = usePortalCreateEmployee();
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [dept, setDept] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (
      !name.trim() ||
      !designation.trim() ||
      !dept.trim() ||
      !password.trim()
    ) {
      toast.error("Fill all fields");
      return;
    }
    createEmployee.mutate(
      {
        name: name.trim(),
        designation: designation.trim(),
        department: dept.trim(),
        email: "",
        loginPassword: password,
        companyId,
        permissions: ["Tasks"],
      },
      {
        onSuccess: () => {
          setName("");
          setDesignation("");
          setDept("");
          setPassword("");
        },
      },
    );
  };

  return (
    <div className="space-y-2 h-full flex flex-col justify-between">
      <div className="space-y-2">
        <Input
          placeholder="Full name*"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xs h-8"
        />
        <Input
          placeholder="Designation*"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          className="text-xs h-8"
        />
        <Input
          placeholder="Department*"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="text-xs h-8"
        />
        <Input
          type="password"
          placeholder="Password*"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-xs h-8"
        />
      </div>
      <Button
        size="sm"
        className="w-full h-8 text-xs"
        onClick={handleSubmit}
        disabled={createEmployee.isPending}
        data-ocid="widget-quick-add-employee"
      >
        {createEmployee.isPending ? "Adding..." : "Add Employee"}
      </Button>
    </div>
  );
}

// ─── Widget renderer ───────────────────────────────────────────────────────────

function WidgetContent({
  widget,
  companyId,
}: { widget: DashboardWidget; companyId: string }) {
  switch (widget.type) {
    case "members":
      return <TotalMembersWidget companyId={companyId} />;
    case "tasks-overview":
      return <TasksOverviewWidget companyId={companyId} />;
    case "activity":
      return <RecentActivityWidget companyId={companyId} />;
    case "deadlines":
      return <UpcomingDeadlinesWidget companyId={companyId} />;
    case "department-breakdown":
      return <DepartmentTasksWidget companyId={companyId} />;
    case "quick-add-task":
      return <QuickAddTaskWidget companyId={companyId} />;
    case "quick-add-employee":
      return <QuickAddEmployeeWidget companyId={companyId} />;
    default:
      return null;
  }
}

// ─── Draggable Widget Card ─────────────────────────────────────────────────────

function WidgetCard({
  widget,
  companyId,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  widget: DashboardWidget;
  companyId: string;
  onRemove: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, id: string) => void;
}) {
  const meta = WIDGET_META[widget.type];
  const Icon = meta.icon;
  return (
    <Card
      className="flex flex-col shadow-md bg-card border-border transition-all duration-200 hover:shadow-lg h-full"
      draggable
      onDragStart={(e) => onDragStart(e, widget.i)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, widget.i)}
      data-ocid={`widget-card-${widget.type}`}
    >
      <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between space-y-0 gap-2 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="size-4 text-muted-foreground flex-shrink-0" />
          <Icon className="size-4 text-primary flex-shrink-0" />
          <CardTitle className="text-sm font-semibold text-foreground truncate">
            {widget.title}
          </CardTitle>
        </div>
        <button
          type="button"
          onClick={() => onRemove(widget.i)}
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          aria-label={`Remove ${widget.title}`}
          data-ocid={`widget-remove-${widget.type}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4 overflow-hidden">
        <WidgetContent widget={widget} companyId={companyId} />
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PortalAdminDashboardPage() {
  const { portalSession } = usePortalAuth();
  const companyId = usePortalCompanyId();
  const adminId =
    portalSession?.role === "portalAdmin" ? portalSession.adminId : undefined;

  const { data: savedWidgets, isLoading } = usePortalDashboardLayout(adminId);
  const saveLayout = usePortalSaveDashboardLayout();

  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const dragIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (savedWidgets) setWidgets(savedWidgets);
  }, [savedWidgets]);

  const handleDragStart = useCallback(
    (_e: DragEvent<HTMLDivElement>, id: string) => {
      dragIdRef.current = id;
    },
    [],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
      const sourceId = dragIdRef.current;
      if (!sourceId || sourceId === targetId) return;
      setWidgets((prev) => {
        const arr = [...prev];
        const si = arr.findIndex((w) => w.i === sourceId);
        const ti = arr.findIndex((w) => w.i === targetId);
        [arr[si], arr[ti]] = [arr[ti], arr[si]];
        return arr;
      });
      dragIdRef.current = null;
    },
    [],
  );

  const handleRemove = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.i !== id));
  }, []);

  const handleSave = useCallback(() => {
    if (!adminId) return;
    saveLayout.mutate({ adminId, widgets });
  }, [adminId, widgets, saveLayout]);

  const handleRestore = useCallback(() => {
    setWidgets(DEFAULT_LAYOUT);
    if (adminId) saveLayout.mutate({ adminId, widgets: DEFAULT_LAYOUT });
  }, [adminId, saveLayout]);

  const availableToAdd = (
    Object.keys(WIDGET_META) as DashboardWidget["type"][]
  ).filter((type) => !widgets.some((w) => w.type === type));

  const handleAddWidget = (type: DashboardWidget["type"]) => {
    const meta = WIDGET_META[type];
    const newWidget: DashboardWidget = {
      i: type,
      x: 0,
      y: 99,
      w: 1,
      h: 1,
      type,
      title: meta.label,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setAddOpen(false);
  };

  // Determine grid sizing based on widget type
  const widgetClass = (widget: DashboardWidget) => {
    if (widget.type === "tasks-overview" || widget.type === "activity")
      return "col-span-1 md:col-span-2 row-span-2";
    if (widget.type === "department-breakdown")
      return "col-span-1 md:col-span-2 row-span-2";
    return "col-span-1 row-span-1";
  };

  if (isLoading) {
    return (
      <PortalLayout requiredRole="portalAdmin">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout requiredRole="portalAdmin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {portalSession?.role === "portalAdmin"
              ? portalSession.company.name
              : ""}{" "}
            · Admin Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            className="gap-2"
            data-ocid="dashboard-restore"
          >
            <RefreshCw className="size-3.5" /> Restore Default
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="gap-2"
            data-ocid="dashboard-add-widget"
          >
            <Plus className="size-3.5" /> Add Widget
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveLayout.isPending}
            className="gap-2"
            data-ocid="dashboard-save-layout"
          >
            <Layout className="size-3.5" />{" "}
            {saveLayout.isPending ? "Saving..." : "Save Layout"}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {widgets.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center h-64 gap-3">
          <Layout className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No widgets. Add some above.
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Add Widget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px]">
          {widgets.map((widget) => (
            <div key={widget.i} className={widgetClass(widget)}>
              <WidgetCard
                widget={widget}
                companyId={companyId ?? ""}
                onRemove={handleRemove}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          {availableToAdd.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              All widgets are on your dashboard already.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 py-2">
              {availableToAdd.map((type) => {
                const meta = WIDGET_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddWidget(type)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors"
                    data-ocid={`add-widget-${type}`}
                  >
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {meta.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {meta.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
