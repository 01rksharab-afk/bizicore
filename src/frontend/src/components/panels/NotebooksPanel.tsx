import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, FilePlus2, NotebookPen, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const LS_KEY = "bizcore_notebooks_v2";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function persistNotes(notes: Note[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
  } catch {
    /* quota exceeded — silent */
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

function snippet(body: string): string {
  const s = body.trim().replace(/\n/g, " ");
  return s.length > 80 ? `${s.slice(0, 80)}…` : s || "No content yet";
}

function makeNote(): Note {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Untitled Note",
    body: "",
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotebooksPanel({ onClose }: { onClose: () => void }) {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [activeId, setActiveId] = useState<string | null>(
    () => loadNotes()[0]?.id ?? null,
  );

  // Title edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Debounce timer
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = notes.find((n) => n.id === activeId) ?? null;

  // Focus body when switching notes
  useEffect(() => {
    if (active && !editingTitle) {
      bodyRef.current?.focus();
    }
  }, [active, editingTitle]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle) titleRef.current?.select();
  }, [editingTitle]);

  // ── Mutations ──

  const updateNotes = useCallback((updated: Note[]) => {
    setNotes(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistNotes(updated), 1000);
  }, []);

  function createNote() {
    const note = makeNote();
    const updated = [note, ...notes];
    updateNotes(updated);
    setActiveId(note.id);
    // Start title editing immediately
    setDraftTitle(note.title);
    setEditingTitle(true);
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    updateNotes(updated);
    if (activeId === id) {
      setActiveId(updated[0]?.id ?? null);
      setEditingTitle(false);
    }
  }

  function handleBodyChange(value: string) {
    if (!active) return;
    const updated = notes.map((n) =>
      n.id === activeId ? { ...n, body: value, updatedAt: Date.now() } : n,
    );
    updateNotes(updated);
  }

  function commitTitle() {
    if (!active) return;
    const title = draftTitle.trim() || "Untitled Note";
    const updated = notes.map((n) =>
      n.id === activeId ? { ...n, title, updatedAt: Date.now() } : n,
    );
    updateNotes(updated);
    setEditingTitle(false);
  }

  function startEditingTitle() {
    if (!active) return;
    setDraftTitle(active.title);
    setEditingTitle(true);
  }

  // ── Render ──

  return (
    <aside
      className="fixed top-0 left-[240px] z-50 h-full flex flex-col bg-card border-r border-border shadow-2xl"
      style={{ width: "680px" }}
      data-ocid="panel-notebooks"
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <NotebookPen className="size-4 text-accent" />
          <span className="font-semibold text-sm text-foreground">
            Notebooks
          </span>
          <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-accent/10 text-accent tabular-nums">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-accent hover:text-accent"
            onClick={createNote}
            data-ocid="notebook-new-btn"
          >
            <FilePlus2 className="size-3.5" />
            New Note
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
            aria-label="Close notebooks"
            data-ocid="notebook-close-btn"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* ─── Body: split pane ─── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: note list */}
        <div className="w-52 shrink-0 flex flex-col border-r border-border bg-background/50 overflow-y-auto">
          {notes.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 h-full px-4 text-center"
              data-ocid="notebook-empty-state"
            >
              <BookOpen className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create your first note to start writing
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-3 border-accent/40 text-accent hover:bg-accent/10"
                onClick={createNote}
                data-ocid="notebook-empty-cta"
              >
                <FilePlus2 className="size-3.5 mr-1.5" />
                New Note
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col py-1">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(note.id);
                      setEditingTitle(false);
                    }}
                    data-ocid="notebook-list-item"
                    className={cn(
                      "group w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors relative",
                      note.id === activeId
                        ? "bg-accent/10 border-l-2 border-l-accent"
                        : "hover:bg-muted/60 border-l-2 border-l-transparent",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium truncate pr-5",
                        note.id === activeId
                          ? "text-accent"
                          : "text-foreground",
                      )}
                    >
                      {note.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {snippet(note.body)}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 mt-1">
                      {formatDate(note.updatedAt)}
                    </p>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      aria-label={`Delete ${note.title}`}
                      data-ocid="notebook-delete-btn"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: editor */}
        {active ? (
          <div className="flex flex-col flex-1 min-w-0 bg-background">
            {/* Note title */}
            <div className="px-5 pt-4 pb-2 border-b border-border shrink-0">
              {editingTitle ? (
                <input
                  ref={titleRef}
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTitle();
                    if (e.key === "Escape") {
                      setDraftTitle(active.title);
                      setEditingTitle(false);
                    }
                  }}
                  className="w-full bg-transparent text-foreground font-display text-base font-semibold outline-none border-b border-accent/60 pb-0.5 caret-accent"
                  data-ocid="notebook-title-edit"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditingTitle}
                  className="text-left w-full font-display text-base font-semibold text-foreground hover:text-accent transition-colors truncate"
                  data-ocid="notebook-title-display"
                  title="Click to rename"
                >
                  {active.title}
                </button>
              )}
              <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                <span>Created {formatDate(active.createdAt)}</span>
                <span>·</span>
                <span>Edited {formatDate(active.updatedAt)}</span>
              </div>
            </div>

            {/* Body textarea */}
            <textarea
              ref={bodyRef}
              value={active.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Start writing…"
              className="flex-1 w-full resize-none bg-transparent text-foreground text-sm leading-relaxed p-5 outline-none placeholder:text-muted-foreground/50 font-body"
              data-ocid="notebook-body-editor"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center text-muted-foreground/50">
              <NotebookPen className="size-8 mx-auto mb-2" />
              <p className="text-sm">Select a note to edit</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
