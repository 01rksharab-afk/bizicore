# BizCore Design System

**Direction:** Professional B2B SaaS with deep slate navy primary (0.42/0.68), emerald teal accent (0.6/0.65). Minimalist, data-focused. Three theme modes: dark (default), light, draft. Multi-role portal features: 3-type registration (Company/Organization, Multi Group, Individual) with dynamic forms, dual login (Admin email+password / Employee ID+password), admin dashboard with drag-drop widgets (card-elevated, shadow-md), employee dashboard (flat task cards, border-only). Sidebar navigation is role-based and collapsible. No decoration; information hierarchy and zone elevation drive visual structure.

## Color Palette

| Token      | Light OKLCH      | Dark OKLCH       | Draft OKLCH      | Role                        |
| ---------- | ---------------- | ---------------- | ---------------- | --------------------------- |
| background | 0.98 0.008 230   | 0.13 0.02 235    | 0.85 0.04 50     | Primary surface             |
| foreground | 0.18 0.015 230   | 0.92 0.01 235    | 0.22 0.02 50     | Text, form labels, data     |
| card       | 1.0 0.004 230    | 0.17 0.022 235   | 0.88 0.035 50    | Elevated widget/form areas  |
| primary    | 0.42 0.14 240    | 0.68 0.16 240    | 0.58 0.08 35     | Deep slate navy, CTAs       |
| accent     | 0.6 0.15 170     | 0.65 0.18 170    | 0.6 0.12 170     | Emerald teal, interactive   |
| muted      | 0.94 0.01 230    | 0.21 0.025 235   | 0.79 0.03 50     | Borders, dividers, disabled |
| destructive| 0.55 0.22 25     | 0.65 0.19 22     | 0.58 0.15 25     | Errors, high-priority tasks |

## Typography

- Display: Space Grotesk — Headlines, registration type titles, widget titles
- Body: DM Sans — Form content, task descriptions, data tables, list items
- Mono: Geist Mono — Serial numbers, employee IDs, status codes
- Scale: Hero 5xl bold, H2 3xl bold, Widget title sm semibold, Form label sm semibold, Body base, Caption xs

## Zones

| Zone                    | Background          | Border            | Notes                                              |
| ----------------------- | ------------------- | ----------------- | -------------------------------------------------- |
| Login/Registration Hero | `bg-background`     | —                 | Full viewport, centered headline, card grid below |
| Registration Type Cards | `bg-card`           | `border-border`   | 3-col grid (lg), 1-col (sm), hover: primary border |
| Registration Form       | `bg-background`     | —                 | Form fields: `bg-input`, `rounded-md`              |
| Admin Sidebar           | `bg-sidebar`        | `border-border`   | Fixed left nav, collapsed on sm, role-based menu   |
| Admin Dashboard Grid    | `bg-background`     | —                 | 4-col layout (lg), 2-col (md), 1-col (sm)          |
| Admin Widgets           | `bg-card`           | `border-border`   | Elevated (`shadow-md`), hover: `shadow-lg`         |
| Employee Task Cards     | `bg-card`           | `border-border`   | 2-col grid (lg), 1-col (sm), flat (border-only)    |
| Task Priority Badge     | contextual (`bg-*/10`) | —              | High: destructive, Medium: yellow, Low: primary    |

## Components

- **Auth Cards**: Border, rounded-lg, icon + title + description + CTA button. Hover: subtle border highlight (accent/50). No shadow or lift.
- **Registration Type Selector**: 3 equal-width cards, centered icons, titles, descriptions. Active state: primary border + primary/5 background. Click → reveals form below.
- **Form Fields**: Input/textarea/select use `bg-input`, `border-border`, `rounded-md`. Focus: `ring-2 ring-primary`, no border highlight. Labels: `text-sm font-semibold`.
- **Admin Widgets**: Card-based, elevated with `shadow-md`, 4-column grid layout. Titles: `text-sm font-semibold`. Content uses semantic tokens. Drag-handle icon top-right (cursor: grab).
- **Task Cards**: Flat (border-only), no shadow. Header: title + priority badge + status. Priority badges: High (destructive/10), Medium (yellow/10), Low (primary/10). Status dropdown: minimal, text-based.
- **Sidebar Items**: `role-sidebar-item` class. Active: primary bg + white text. Hover: accent/10 bg + accent text. Icons 16px, labels 14px.

## Sidebar Panels

| Panel              | Trigger    | Style      | Content                              |
| ------------------ | ---------- | ---------- | ------------------------------------ |
| Theme Toggle       | Sun icon   | 3 buttons  | Dark / Light / Draft selector        |
| Notifications      | Bell icon  | Modal list | Grouped by type (system, tasks, inv) |
| User Menu          | Avatar     | Dropdown   | Profile, settings, logout            |
| Company Selector   | Logo area  | Dropdown   | Switch between orgs (admin)          |

## Motion

- Login Load: Fade-in 500ms ease-out for hero + staggered card reveals (100ms each).
- Form Submission: No animation; instant feedback via toast.
- Widgets: No entrance animation; dashboard grid loads atomically.
- Hover: Button opacity 0.9, card border highlight to primary/30, shadow lift on admin widget.
- Drag-Drop: No visual feedback during drag; subtle grid guidelines on hover (border-primary/20).

## Multi-Role Portal Patterns

- **Registration**: 3-type selector → dynamic form → validation → success toast → redirect to dashboard.
- **Admin Login**: Email + password → authenticate → admin dashboard (full widget access).
- **Employee Login**: Employee ID + password (set by admin) → authenticate → employee dashboard (task-only view, no admin access).
- **Admin Dashboard**: Drag-drop widget board using react-grid-layout. Widgets persist layout per admin. Can add/remove/rearrange.
- **Employee Dashboard**: My Assigned Tasks (2-col grid), status update dropdown, profile sidebar, notifications.

## Utilities

- `.registration-type-selector` — 3-col grid for type cards.
- `.registration-form` — Max-width 2xl form container.
- `.form-group`, `.form-label`, `.form-input`, `.form-error` — Form component styling.
- `.admin-dashboard-grid` — 4-col auto-row layout for widgets.
- `.admin-widget` — Card-based widget with shadow and hover lift.
- `.employee-dashboard-grid` — 2-col responsive grid for task cards.
- `.task-card`, `.task-priority-badge` — Task card styling + priority indicators.
- `.role-sidebar-item` — Sidebar menu item with active/hover states.
