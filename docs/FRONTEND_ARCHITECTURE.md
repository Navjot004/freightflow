# Frontend Architecture & UX Specification

## 1. Architecture & Tech Stack
*   **Framework**: React 18 + TypeScript + Vite.
*   **State Management**: 
    *   **Zustand**: For global, synchronous UI state (Themes, Sidebar toggles, active company context).
    *   **React Query**: For asynchronous server state, aggressive caching, and optimistic UI updates.
*   **Forms**: `react-hook-form` paired with `zod` for rigorous client-side validation.
*   **Styling**: Tailwind CSS + shadcn/ui.

## 2. Route Hierarchy & Role-Based Views
The `<AppShell />` dynamically renders navigation based on the active Context Token.
*   `/dashboard`: Tailored KPI views (e.g., Dispatchers see Fleet Utilization; Shippers see Freight Spend).
*   `/loads`, `/marketplace`, `/shipments`, `/finance`, `/fleet`, `/network`.

## 3. UX Principles
*   **Atomic Design**: Components are structured as Atoms, Molecules, Organisms, and Templates.
*   **Mobile Driver Interface**: Bottom-tab navigation. High-contrast, large swipeable buttons for status changes to prevent accidental taps. Full offline-sync capability via Service Workers for areas with poor cell service.
*   **Dark Mode**: Native support using `dark:` Tailwind variants (e.g., `bg-slate-950`).
*   **Empty States**: Illustrated components with clear Call-To-Action buttons instead of blank tables.

## 4. Real-Time Integration
*   **WebSockets**: Frontend listens to specific namespaces (e.g., `/ws/company/{id}`). Incoming events trigger `queryClient.setQueryData()` to forcefully update the React Query cache without requiring an HTTP refetch.
*   **API Client**: Axios interceptor automatically attaches the Context Token and handles silent Refresh Token rotation on `401 Unauthorized` errors.
