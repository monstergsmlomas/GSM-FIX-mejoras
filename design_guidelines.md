# Design Guidelines: Repair Shop Management System

## Design Approach: Tailored System for Data-Dense Operations

**Selected Framework**: Custom design system inspired by Fluent Design and modern dashboard patterns (Linear, Notion, Asana) optimized for daily technical operations.

**Rationale**: This is a utility-focused application requiring efficiency, quick data scanning, and frequent daily use by technicians. Visual hierarchy and information density take priority over decorative elements.

**Core Principles**:
- Information clarity over visual flair
- Quick scanability with status-based color coding
- Persistent navigation for rapid context switching
- Dense but organized data displays

---

## Typography System

**Primary Font**: Inter (via Google Fonts)
**Secondary Font**: JetBrains Mono (for IMEI/serial numbers)

**Hierarchy**:
- Page Titles: text-2xl, font-semibold (Dashboard, Órdenes de Reparación)
- Section Headers: text-lg, font-semibold (Órdenes Activas, Historial)
- Card Titles: text-base, font-medium
- Body Text: text-sm, font-normal
- Labels/Metadata: text-xs, font-medium, uppercase tracking-wide
- Technical Data (IMEI/Serial): text-sm, font-mono

---

## Layout & Spacing System

**Tailwind Units**: Use 2, 4, 6, 8, 12, 16 for consistent rhythm

**Application Structure**:
- Fixed sidebar (w-64): Navigation, always visible
- Main content area: max-w-7xl with px-6 py-8
- Cards: p-6 with rounded-lg, shadow-sm borders
- Form spacing: space-y-6 for sections, space-y-4 for fields
- Table rows: py-4 px-6
- Page headers: mb-8

**Responsive Grid**:
- Stats cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Order cards: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
- Two-column forms: grid-cols-1 md:grid-cols-2 gap-6

---

## Component Library

### Navigation (Fixed Sidebar)
- Company logo/name at top (h-16)
- Primary nav items with icons (Heroicons): Dashboard, Órdenes, Clientes, Cobros, Reportes
- Active state: subtle background fill with accent border-l-4
- User profile at bottom with role indicator

### Status Badges
**Required States with semantic meanings**:
- Recibido: Badge with dot indicator, neutral styling
- Diagnóstico: Blue accent, diagnostic icon
- En Curso: Orange/amber, progress indicator
- Listo: Green, checkmark icon
- Entregado: Muted gray, archive icon

Badge style: px-3 py-1, rounded-full, text-xs font-medium, inline-flex items-center gap-2

### Order Cards
- Header: Device type + brand, status badge (right-aligned)
- Body: Customer name, IMEI (monospace), entry date, estimated completion
- Footer: Technician assigned, priority indicator if urgent
- Hover: subtle shadow elevation, no transform
- Click area: entire card navigates to detail view

### Search & Filters
- Prominent search bar (sticky): IMEI/Serial/Customer search with icon, rounded-lg, h-12
- Filter chips: horizontal scrollable row below search
- Quick filters: "Hoy", "Esta Semana", "Pendientes", "Listos para Entregar"

### Data Tables
- Striped rows for scanability (odd rows with subtle background)
- Fixed header on scroll
- Columns: checkbox, device info, customer, status, technician, dates, actions
- Actions: icon-only buttons (edit, view, print) in dropdown menu
- Responsive: stack to cards on mobile

### Forms (Customer & Order Entry)
- Two-column layout on desktop
- Section dividers with text-sm font-semibold headers
- Input fields: h-11, px-4, rounded-md borders
- Required field indicators: red asterisk
- Device history: timeline component with connecting lines
- Payment history: compact table within customer card

### Dashboard Stats Cards
- Four-column grid showing: Órdenes Activas, Pendientes Diagnóstico, Listas para Entregar, Ingresos del Mes
- Large number (text-3xl font-bold), label below (text-sm)
- Icon top-right corner, subtle background tint
- Trend indicator (↑/↓) with percentage change

### Charts & Reports
- Bar charts for weekly revenue, repair volume
- Pie chart for repair types distribution
- Line graph for monthly trends
- Date range picker: from-to inputs with calendar popup
- Export button: "Exportar PDF/Excel" with download icon

### Invoice/Payment Components
- Invoice summary card: total due, paid amount, balance
- Payment method selector: radio buttons with icons (Efectivo, Tarjeta, Transferencia)
- Receipt printer button: prominent, primary action
- Transaction history: minimal table with date, amount, method

---

## Key Screen Layouts

**Dashboard**: 4-stat cards → Active orders table → Recent activities timeline → Quick actions (Nueva Orden, Buscar Cliente)

**Órdenes List**: Search/filter bar → Status tabs → Card grid with infinite scroll, empty state with illustration

**Order Detail**: Device info card (left) + Status timeline (right) → Repair details form → Parts used table → Payment section → Notes textarea

**Cliente Detail**: Customer info header → Device history cards → Payment summary → Communication log

**Reportes**: Date range selector → Metric cards → Charts section (2-column) → Detailed data table → Export tools

---

## Interaction Patterns

**Minimal Animations**:
- Status transitions: subtle color fade (300ms)
- Card hover: shadow elevation only
- Dropdown menus: slide-down with fade (150ms)
- Toast notifications: slide-in from top-right
- No page transitions, no scroll effects

**Icons**: Heroicons (outline style for nav, solid for status indicators)

**Empty States**: Centered illustration + headline + "Crear [item]" button

**Loading States**: Skeleton screens for tables/cards, spinner for actions

---

## No Images Required

This is a data-management application. No hero images or marketing photography needed. Use icons and illustrations only for empty states and onboarding flows.