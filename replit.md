# RepairShop - Sistema de Gestión de Reparaciones

## Overview

RepairShop is a repair shop management system designed for mobile device repair businesses. It provides a complete workflow for managing repair orders, clients, devices, payments, and business reporting. The application is built with a Spanish-language interface optimized for daily technical operations with emphasis on information density and quick data scanning.

Key features include:
- Dashboard with real-time stats and order tracking
- Repair order lifecycle management (received → diagnosis → in progress → ready → delivered)
- Client and device registry with IMEI/serial number tracking
- Payment processing with multiple payment methods
- Business analytics and reporting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system supporting light/dark themes

The frontend follows a page-based architecture with reusable components. Pages are located in `client/src/pages/` and shared components in `client/src/components/`. The design system prioritizes information clarity and quick scanability over visual decoration, as specified in `design_guidelines.md`.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API endpoints prefixed with `/api/`
- **Build System**: Vite for development, esbuild for production server bundling
- **Static Serving**: Production builds serve from `dist/public`

The server uses a modular structure:
- `server/index.ts` - Application entry point and middleware setup
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Data access layer interface
- `server/vite.ts` - Development server with HMR
- `server/static.ts` - Production static file serving

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` using Zod for validation
- **Migrations**: Managed via `drizzle-kit push`

Core entities:
- **Clients**: Customer information with contact details
- **Devices**: Mobile devices with IMEI/serial tracking linked to clients
- **RepairOrders**: Repair tickets with status workflow, priority, and cost tracking
- **Payments**: Payment records with method tracking (cash, card, transfer)
- **Users**: Authentication support (structure present)

### Shared Code
The `shared/` directory contains schemas and types used by both frontend and backend, ensuring type safety across the full stack.

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit for type-safe queries
- **connect-pg-simple**: Session storage for Express sessions

### UI/UX Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation
- **embla-carousel-react**: Carousel component
- **recharts**: Charting library for reports
- **vaul**: Drawer component
- **cmdk**: Command palette component

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Zod integration for React Hook Form
- **drizzle-zod**: Zod schema generation from Drizzle schemas

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across the stack
- **@replit/vite-plugin-***: Replit-specific development plugins